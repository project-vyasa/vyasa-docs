<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ViewerDb } from '../lib/ViewerDb';
  import initWasm, { VyasaViewerRuntime } from '../vyasac-wasm/vyasac.js';

  export let catalogs: string[] = ['/samples/catalog.json'];

  let catalogMeta: any = null;
  let catalogItems: any[] = [];
  let selectedWork: string | null = null;
  let activeWorkItem: any = null;
  
  let packageData: {
      manifest: any;
      structure: any;
      projections: Record<string, string>;
  } | null = null;

  let activeView: string = 'reference';
  let availableViews: string[] = [];
  
  let urnComponents: string[] = [];
  let schemeParts: string[] = [];
  let filters: Record<string, string> = {};
  let activeUrns: string[] = [];
  
  let iframeElement: HTMLIFrameElement;
  let viewerDb = new ViewerDb();
  let graphRuntime: VyasaViewerRuntime | null = null;
  let loadedBlocks: Record<string, Record<string, string>> = {};
  let srcdocContent = '';
  
  let errorMessage: string | null = null;
  let isInspecting: boolean = false;
  let isInspectingCatalog: boolean = false;
  let inspectData: any = null;

  onMount(async () => {
      window.addEventListener('message', handleMessage);
      // TODO: Find a way to pass URL params for deep linking (work, URN components, layout view)
      // This is necessary to share deep links with others.
      try {
          await initWasm();
          const res = await fetch(`${catalogs[0]}?t=${Date.now()}`);
          if (res.ok) {
              const data = await res.json();
              if (data.catalog && data.items) {
                  catalogMeta = data.catalog;
                  catalogItems = data.items;
              } else {
                  // Fallback for older index.json arrays
                  catalogItems = data;
              }
          }
      } catch (e) {
          console.error("Failed to load catalog or wasm", e);
      }
  });

  onDestroy(() => {
      if (typeof window !== 'undefined') {
          window.removeEventListener('message', handleMessage);
      }
  });

  async function loadWork(item: any) {
      selectedWork = item.id;
      activeWorkItem = item;
      packageData = null;
      loadedBlocks = {};
      srcdocContent = '';
      filters = {};
      errorMessage = null;
      
      if (item.payloadUrl) {
          try {
              const catalogBase = catalogs[0].substring(0, catalogs[0].lastIndexOf('/') + 1);
              const payloadFullUrl = item.payloadUrl.startsWith('http') || item.payloadUrl.startsWith('/') 
                                     ? item.payloadUrl 
                                     : catalogBase + item.payloadUrl;
              
              await viewerDb.loadFromUrl(payloadFullUrl + "?t=" + Date.now());
              console.log("Loaded SQLite database");
              
              try {
                  const manifestRows = await viewerDb.query("SELECT key, value FROM manifest");
                  const manifest: Record<string, string> = {};
                  for (const row of manifestRows) {
                      manifest[row[0]] = row[1];
                  }
                  if (manifest['package_type'] !== 'view') {
                      errorMessage = `Unsupported package type. Expected 'view', got '${manifest['package_type'] || 'unknown'}'. Please recompile with --target view.`;
                      return;
                  }
                  if (manifest['schema_version'] !== '1') {
                      const ver = manifest['schema_version'] || 'unknown';
                      errorMessage = `Unsupported schema version. Expected '1', got '${ver}'. Please recompile with the latest compiler.`;
                      return;
                  }
              } catch (e) {
                  // Fallback for older packages
                  try {
                      await viewerDb.query("SELECT 1 FROM urns LIMIT 1");
                  } catch (err) {
                      errorMessage = "Invalid package format. Missing necessary viewer tables. Please recompile with --target view.";
                      return;
                  }
              }
              
              const manifestRows = await viewerDb.query("SELECT key, value FROM manifest");
              const manifest: Record<string, string> = {};
              for (const row of manifestRows) {
                  manifest[row[0] as string] = row[1] as string;
              }
              console.log("Loaded manifest:", manifest);
              const urnsRows = await viewerDb.query("SELECT id, title, streams FROM urns ORDER BY id");
              const structure = { urns: [] as any[] };
              for (const row of urnsRows) {
                  structure.urns.push({
                      id: row[0],
                      title: row[1],
                      streams: JSON.parse(row[2] as string)
                  });
              }
              // Sort urns numerically rather than lexicographically
              try {
                  structure.urns.sort((a, b) => {
                      const aParts = String(a.id || '').split(':');
                      const bParts = String(b.id || '').split(':');
                      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
                          const aNum = parseInt(aParts[i], 10);
                          const bNum = parseInt(bParts[i], 10);
                          if (!isNaN(aNum) && !isNaN(bNum)) {
                              if (aNum !== bNum) return aNum - bNum;
                          } else {
                              if (aParts[i] !== bParts[i]) return aParts[i].localeCompare(bParts[i]);
                          }
                      }
                      return aParts.length - bParts.length;
                  });
              } catch (err) {
                  console.error("Sorting error:", err);
              }
              
              const tplRows = await viewerDb.query("SELECT view_name, block_type, content FROM html_templates");
              const projections: Record<string, string> = {};
              const viewSet = new Set<string>();
              
              for (const row of tplRows) {
                  const viewName = row[0] as string;
                  const blockType = row[1] as string;
                  const htmlContent = row[2] as string;
                  viewSet.add(viewName);
                  projections[`${viewName}_${blockType}`] = htmlContent;
              }
              
              if (Object.keys(projections).length === 0 || manifest['stat_total_templates'] === '0') {
                  errorMessage = "Invalid package format. The database contains no HTML templates. Please check your [[projection]] configuration in vyasac.toml and repack.";
                  return;
              }
              
              availableViews = Array.from(viewSet);
              packageData = { manifest, structure, projections };
              
              if (availableViews.includes('reference')) activeView = 'reference';
              else if (availableViews.length > 0) activeView = availableViews[0];
              
              const urnScheme = packageData.manifest['urn_scheme'] || 'urn:vyasa:{id}';
              schemeParts = urnScheme.replace(/^urn:vyasa:/, '').split(':');
              
              let globalPrefix = schemeParts[0] || 'urn:vyasa:';
              if (!globalPrefix.startsWith('urn:vyasa:')) {
                  globalPrefix = 'urn:vyasa:' + globalPrefix;
              }

              let hierarchyJson = "[]";
              let bitLayoutJson = "null";
              try {
                  const metaRows = await viewerDb.query("SELECT key, value FROM _meta WHERE category = 'config'");
                  for (const row of metaRows) {
                      if (row[0] === 'urn_hierarchy') hierarchyJson = row[1] as string;
                      if (row[0] === 'urn_bit_layout') bitLayoutJson = row[1] as string;
                  }
              } catch(e) {
                  console.warn("Could not load _meta", e);
              }

              if (hierarchyJson === "[]" && packageData.manifest.urn_hierarchy) {
                  hierarchyJson = packageData.manifest.urn_hierarchy;
              }

              try {
                  urnComponents = JSON.parse(hierarchyJson);
              } catch (e) {
                  urnComponents = schemeParts.filter((s: string) => s.startsWith('{') && s.endsWith('}')).map((s: string) => s.substring(1, s.length - 1));
                  hierarchyJson = JSON.stringify(urnComponents);
              }
              
              graphRuntime = new VyasaViewerRuntime(hierarchyJson, bitLayoutJson, globalPrefix);
              
              // Determine grouping levels: all URN components except the last (leaf) one.
              // The leaf level is not used as a filter — it's what we display per item.
              // Set initial filter to first value of each grouping level.
              if (structure.urns.length > 0) {
                  const firstUrnParts = structure.urns[0].id.split(':');
                  const leafIndex = urnComponents.length - 1; // last component is the leaf
                  for (let i = 0; i < urnComponents.length; i++) {
                      if (i < leafIndex) {
                          filters[urnComponents[i]] = firstUrnParts[i];
                      }
                  }
              }
              
              applyFilters();
              
          } catch (e: any) {
              console.error("Failed to load vyview package", e);
              errorMessage = "Failed to load vyview package: " + e.message;
          }
      }
  }

  async function showInfo(item: any, event: Event) {
      event.stopPropagation();
      errorMessage = null;
      isInspecting = true;
      inspectData = { name: item.name, id: item.id, manifest: {}, structure: {}, templates: [] };
      try {
          const catalogBase = catalogs[0].substring(0, catalogs[0].lastIndexOf('/') + 1);
          const payloadFullUrl = item.payloadUrl.startsWith('http') || item.payloadUrl.startsWith('/') 
                                 ? item.payloadUrl 
                                 : catalogBase + item.payloadUrl;
          
          await viewerDb.loadFromUrl(payloadFullUrl + "?t=" + Date.now());
          
          const manifestRows = await viewerDb.query("SELECT key, value FROM manifest ORDER BY key");
          inspectData.streams = {};
          for (const row of manifestRows) {
              const key = row[0] as string;
              const value = row[1] as string;
              if (key.startsWith("stream_stats_")) {
                  try {
                      inspectData.streams[key.replace("stream_stats_", "")] = JSON.parse(value);
                  } catch (e) {
                      inspectData.streams[key.replace("stream_stats_", "")] = value;
                  }
              } else {
                  inspectData.manifest[key] = value;
              }
          }
          
          try {
              const metaRows = await viewerDb.query("SELECT category, key, value FROM _meta");
              inspectData.meta = {};
              for (const row of metaRows) {
                  if (!inspectData.meta[row[0]]) inspectData.meta[row[0]] = {};
                  inspectData.meta[row[0]][row[1]] = row[2];
              }
          } catch (e) {
              inspectData.meta = { error: "No _meta table found" };
          }
          
          try {
              const urnsRows = await viewerDb.query("SELECT COUNT(*) FROM urns");
              inspectData.structure.totalUrns = urnsRows[0][0];
              const blocksRows = await viewerDb.query("SELECT COUNT(*) FROM ir_blocks");
              inspectData.structure.totalBlocks = blocksRows[0][0];
              try {
                  const itemsRows = await viewerDb.query("SELECT COUNT(DISTINCT id) FROM ir_blocks");
                  inspectData.structure.totalItems = itemsRows[0][0];
              } catch (e) {
                  inspectData.structure.totalItems = "Unknown";
              }
          } catch(e) {
              inspectData.structure.error = "Missing structure tables (urns, ir_blocks)";
          }
          
          try {
              const tplRows = await viewerDb.query("SELECT view_name, block_type FROM html_templates");
              for (const row of tplRows) {
                  inspectData.templates.push(`${row[0]}: ${row[1]}`);
              }
          } catch(e) {
              inspectData.templates.push("Error: html_templates table missing");
          }
          
          inspectData = {...inspectData}; // trigger reactivity
      } catch (e: any) {
          inspectData.error = "Failed to load database: " + e.message;
      }
  }

  function closeInspect() {
      isInspecting = false;
      isInspectingCatalog = false;
      inspectData = null;
  }

  function goBackToCatalog() {
      packageData = null;
      selectedWork = null;
      activeWorkItem = null;
  }

  function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'VYASA_NAVIGATE') {
          const href = event.data.href;
          const parts = href.replace(/^urn:vyasa:/, '').split(':');
          for (let i = 0; i < schemeParts.length; i++) {
              const s = schemeParts[i];
              if (s.startsWith('{') && s.endsWith('}')) {
                  const comp = s.substring(1, s.length - 1);
                  if (parts[i]) {
                      filters[comp] = parts[i];
                  }
              }
          }
          applyFilters();
      }
  }

  function getAvailableOptionsFor(comp: string): string[] {
      if (!packageData) return [];
      const compIdx = urnComponents.indexOf(comp);
      
      const options = new Set<string>();
      packageData.structure.urns.forEach((u: any) => {
          const parts = u.id.split(':');
          
          let matches = true;
          for (let i = 0; i < compIdx; i++) {
              const higherComp = urnComponents[i];
              const filterVal = filters[higherComp];
              if (filterVal && !filterVal.includes('-')) {
                  if (parts[i] !== filterVal) {
                      matches = false;
                  }
              }
          }
          if (matches) {
              const val = parts[compIdx];
              if (val) options.add(val);
          }
      });
      return Array.from(options).sort((a, b) => Number(a) - Number(b));
  }

  function nextFilter(comp: string) {
      const options = getAvailableOptionsFor(comp);
      if (options.length === 0) return;
      
      const val = filters[comp];
      if (!val) {
          filters[comp] = options[0];
      } else {
          const current = val.split('-')[1] || val;
          const idx = options.indexOf(current);
          if (idx >= 0 && idx < options.length - 1) {
              filters[comp] = options[idx + 1];
          }
      }
      
      onFilterChange(comp);
  }

  function prevFilter(comp: string) {
      const options = getAvailableOptionsFor(comp);
      if (options.length === 0) return;
      
      const val = filters[comp];
      if (!val) {
          filters[comp] = options[options.length - 1];
      } else {
          const current = val.split('-')[0];
          const idx = options.indexOf(current);
          if (idx > 0) {
              filters[comp] = options[idx - 1];
          }
      }
      
      onFilterChange(comp);
  }

  function onFilterChange(changedComp: string) {
      const compIdx = urnComponents.indexOf(changedComp);
      const leafIndex = urnComponents.length - 1;
      // Cascade defaults to lower-level filters (except leaf)
      for (let i = compIdx + 1; i < leafIndex; i++) {
          const comp = urnComponents[i];
          const options = getAvailableOptionsFor(comp);
          if (options.length > 0) {
              filters[comp] = options[0];
          }
      }
      applyFilters();
  }

  async function applyFilters() {
      if (!packageData) return;
      
      activeUrns = packageData.structure.urns.filter((u: any) => {
          const parts = u.id.split(':');
          for (let i = 0; i < urnComponents.length; i++) {
              const comp = urnComponents[i];
              const filterVal = filters[comp];
              if (filterVal) {
                  if (filterVal.includes('-')) {
                      const [start, end] = filterVal.split('-').map(Number);
                      const val = Number(parts[i]);
                      if (val < start || val > end) return false;
                  } else {
                      if (parts[i] !== filterVal) return false;
                  }
              }
          }
          return true;
      }).map((u: any) => u.id);
      
      await fetchBlocksAndRender();
  }

  async function fetchBlocksAndRender() {
      if (!activeUrns.length || !packageData || !graphRuntime) {
          srcdocContent = '<div style="padding: 2rem; text-align: center; color: #64748b;">No content matches the selected filters.</div>';
          return;
      }
      
      const startUrn = activeUrns[0];
      const limit = activeUrns.length; // Only fetch exactly the items that match the filter
      
      let rowsJson: any[] = [];
      let allRows = [];
      let fetchedUrns = [];
      try {
          const query = graphRuntime.build_viewport_query(startUrn, limit);
          const rows = await viewerDb.query(query);
          for (const r of rows) {
              allRows.push({
                  id: r[0], // sequence_id (i64)
                  stream: (r[1] as string).startsWith('dependency.') ? r[1] : `local.${r[1]}`,
                  content: r[2]
              });
              if (!fetchedUrns.includes(r[0])) {
                  fetchedUrns.push(r[0]);
              }
          }
          
          // Dependencies are now merged directly into the main database by the packer at build time.
          // We don't need to separately query dependency databases.
          
          if (packageData.manifest.streams_config) {
              try {
                  const streamsConfig = JSON.parse(packageData.manifest.streams_config);
                  const sourceToName: Record<string, string> = {};
                  for (const s of streamsConfig) {
                      sourceToName[s.source] = s.name;
                  }
                  
                  const mappedRows = [];
                  for (const row of allRows) {
                      if (sourceToName[row.stream]) {
                          row.stream = sourceToName[row.stream];
                          mappedRows.push(row);
                      } else {
                          row.stream = row.stream.replace(/^local\./, '');
                          mappedRows.push(row);
                      }
                  }
                  rowsJson = mappedRows;
              } catch (e) {
                  console.error("Failed to apply streams_config", e);
                  rowsJson = allRows.map(r => ({ ...r, stream: r.stream.replace(/^local\./, '') }));
              }
          } else {
              rowsJson = allRows.map(r => ({ ...r, stream: r.stream.replace(/^local\./, '') }));
          }
      } catch(e) {
          console.error("Failed to fetch blocks", e);
      }
      
      const tplRows = await viewerDb.query("SELECT view_name, block_type, content FROM html_templates");
      const templates = tplRows.map(r => ({
          view_name: r[0],
          block_type: r[1],
          content: r[2]
      }));
      const templatesJson = JSON.stringify(templates);
      
      try {
          const viewNodes = graphRuntime.weave_view(rowsJson, templatesJson, activeView);
          
          let itemsHtml = '';
          const layoutTpl = packageData.projections[`${activeView}_layout`] || '{{ body }}';
          
          for (const node of viewNodes) {
              itemsHtml += `<span id="${node.urn}" class="vyasa-node ${node.type}">${node.content}</span>`;
          }
          
          const finalHtml = layoutTpl.replace('{{ body }}', itemsHtml);
          srcdocContent = injectBridge(finalHtml);
      } catch(e) {
          console.error("Weave view failed:", e);
          srcdocContent = `<div style="padding: 2rem; color: red;">Failed to weave view: ${e}</div>`;
      }
  }

  function injectBridge(html: string): string {
      const script = `
      <script>
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link) {
                const href = link.getAttribute('href');
                if (href && href.startsWith('urn:vyasa:')) {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'VYASA_NAVIGATE', href: href }, '*');
                }
            }
        });
        window.addEventListener('message', function(e) {
           if (e.data.type === 'VYASA_SCROLL') {
               const el = document.getElementById(e.data.id);
               if (el) {
                   el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                   el.style.transition = 'background-color 1s';
                   el.style.backgroundColor = '#fff9c4';
                   setTimeout(() => el.style.backgroundColor = 'transparent', 1500);
               }
           }
        });
      </` + `script>`;
      
      if (html.includes('</body>')) {
          return html.replace('</body>', script + '</body>');
      } else {
          return html + script;
      }
  }

  function onIframeLoad() {
      // If there are components and the last one is selected, we could try to scroll to it
      if (urnComponents.length > 0) {
          const lastComp = urnComponents[urnComponents.length - 1];
          if (filters[lastComp]) {
              const targetUrn = activeUrns.find(u => u.endsWith(':' + filters[lastComp]));
              if (targetUrn && iframeElement?.contentWindow) {
                  setTimeout(() => {
                      iframeElement.contentWindow?.postMessage({ type: 'VYASA_SCROLL', id: targetUrn }, '*');
                  }, 100);
              }
          }
      }
  }
</script>

<div class="vyasa-viewer">
   {#if !packageData && !isInspecting && !isInspectingCatalog}
       <div class="catalog-landing">
           <div class="catalog-header">
               <h2>{catalogMeta?.publisher || 'Vyasa Catalog'}</h2>
               {#if catalogMeta}
                   <button class="info-btn" on:click={() => isInspectingCatalog = true} title="Catalog Info">ℹ️</button>
               {/if}
           </div>
           {#if errorMessage}
               <div class="error-alert">{errorMessage}</div>
           {/if}
           <div class="catalog-grid">
           {#each catalogItems as item}
               <!-- svelte-ignore a11y-click-events-have-key-events -->
               <div class="catalog-card" on:click={() => loadWork(item)}>
                   <div class="card-header">
                       <h3>{item.name}</h3>
                       <button class="info-btn" on:click={(e) => showInfo(item, e)} title="Diagnostic Info">ℹ️</button>
                   </div>
                   <p class="meta">{item.id}</p>
               </div>
           {/each}
           </div>
       </div>
   {:else if isInspectingCatalog && catalogMeta}
       <div class="inspect-view">
           <button class="back-btn" on:click={closeInspect}>&larr; Back to Catalog</button>
           <h2>Catalog Info</h2>
           <div class="inspect-section">
               <h3>Metadata</h3>
               <pre>{JSON.stringify(catalogMeta, null, 2)}</pre>
           </div>
       </div>
   {:else if isInspecting && inspectData}
       <div class="inspect-view">
           <button class="back-btn" on:click={closeInspect}>&larr; Back to Catalog</button>
           <h2>Diagnostic Info: {inspectData.name}</h2>
           
           {#if inspectData.error}
              <div class="error-alert">{inspectData.error}</div>
           {:else}
               <div class="inspect-section">
                   <h3>Manifest</h3>
                   <pre>{JSON.stringify(inspectData.manifest, null, 2)}</pre>
               </div>
               <div class="inspect-section">
                   <h3>Meta (System)</h3>
                   <pre>{JSON.stringify(inspectData.meta, null, 2)}</pre>
               </div>
               <div class="inspect-section">
                   <h3>Structure</h3>
                   <pre>{JSON.stringify(inspectData.structure, null, 2)}</pre>
               </div>
               {#if Object.keys(inspectData.streams || {}).length > 0}
               <div class="inspect-section">
                   <h3>Streams</h3>
                   <pre>{JSON.stringify(inspectData.streams, null, 2)}</pre>
               </div>
               {/if}
               <div class="inspect-section">
                   <h3>Templates</h3>
                   <ul>
                   {#each inspectData.templates as tpl}
                       <li>{tpl}</li>
                   {/each}
                   </ul>
               </div>
           {/if}
       </div>
   {:else}
       <div class="viewer-header">
           <div class="header-left">
               <button class="back-btn" on:click={goBackToCatalog}>&larr; Catalog</button>
               <strong>{activeWorkItem?.name || selectedWork}</strong>
           </div>
           
           <div class="filter-bar">
               {#each urnComponents as comp}
                  <div class="filter-group">
                     <label>{comp}</label>
                     <div class="filter-controls">
                         <button on:click={() => prevFilter(comp)}>&lt;</button>
                         <input type="text" list="{comp}-options" bind:value={filters[comp]} on:change={() => onFilterChange(comp)} placeholder="All" />
                         <datalist id="{comp}-options">
                             {#each getAvailableOptionsFor(comp) as opt}
                                 <option value={opt}></option>
                             {/each}
                         </datalist>
                         <button on:click={() => nextFilter(comp)}>&gt;</button>
                     </div>
                  </div>
               {/each}
               {#if availableViews.length > 1}
               <div class="view-selector">
                   <select bind:value={activeView} on:change={applyFilters}>
                       {#each availableViews as view}
                           <option value={view}>{view}</option>
                       {/each}
                   </select>
               </div>
               {/if}
           </div>
       </div>
       
       <div class="content-pane">
          {#if srcdocContent}
             <iframe 
                bind:this={iframeElement}
                srcdoc={srcdocContent} 
                title="Vyasa Content"
                on:load={onIframeLoad}
             ></iframe>
          {:else}
             <div class="placeholder">Loading content...</div>
          {/if}
       </div>
   {/if}
</div>

<style>
  .vyasa-viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      overflow: hidden;
      color: #334155;
      text-align: left;
  }
  .catalog-landing {
      padding: 3rem;
  }
  .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
  }
  .catalog-header h2 {
      margin: 0;
  }
  .catalog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
  }
  .catalog-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8fafc;
  }
  .catalog-card:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
      transform: translateY(-2px);
  }
  .catalog-card h3 {
      margin: 0 0 0.5rem 0;
      color: #0f172a;
  }
  .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
  }
  .info-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.2rem;
      opacity: 0.6;
      transition: opacity 0.2s;
  }
  .info-btn:hover {
      opacity: 1;
  }
  .error-alert {
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      border: 1px solid #fca5a5;
  }
  .inspect-view {
      padding: 2rem;
      overflow-y: auto;
      text-align: left;
  }
  .inspect-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
  }
  .inspect-section h3 {
      margin-top: 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.5rem;
  }
  .inspect-section pre {
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0;
  }
  .catalog-card .meta {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
  }
  
  .viewer-header {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      gap: 2rem;
  }
  .back-btn {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: 1px solid transparent;
  }
  .back-btn:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
  }
  
  .filter-bar {
      display: flex;
      flex: 1;
      gap: 1.5rem;
      align-items: flex-end;
  }
  .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
  }
  .filter-group label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
  }
  .filter-controls {
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      overflow: hidden;
  }
  .filter-controls button {
      background: #f1f5f9;
      border: none;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      color: #475569;
      font-weight: bold;
  }
  .filter-controls button:hover {
      background: #e2e8f0;
  }
  .filter-controls input {
      border: none;
      border-left: 1px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
      padding: 0.4rem;
      width: 60px;
      text-align: center;
      outline: none;
  }
  .filter-controls input:focus {
      background: #f8fafc;
  }
  
  .view-selector {
      margin-left: auto;
  }
  .view-selector select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      background: white;
      outline: none;
  }
  
  .content-pane {
      flex: 1;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
  }
  iframe {
      border: none;
      width: 100%;
      height: 100%;
      background: white;
  }
  .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
      font-size: 1.1rem;
  }
</style>
