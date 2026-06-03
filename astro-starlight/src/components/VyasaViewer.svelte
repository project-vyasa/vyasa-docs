<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as fflate from 'fflate';

  // --- FEATURE BACKLOG TODOs ---
  // TODO: Reduce bundle size by allowing reference to external style sheet
  // TODO: Viewer landing view should be a brief blurb of the catalog and then a set of cards, one for each vyasa package. The sidebar to hold just the title names with large blank area is suboptimal.
  // TODO: Pick few elements like next, previous buttons to cycle through the content efficiently.
  // -----------------------------

  export let catalogs: string[] = ['/samples/index.json'];

  let catalogItems: any[] = [];
  let selectedWork: string | null = null;
  
  // Stores unzipped metadata and HTML text blobs
  let packageData: {
      manifest: any;
      structure: any;
      projections: Record<string, string>;
  } | null = null;

  let activeUrn: string | null = null;
  let activeView: string = 'reference';
  let availableViews: string[] = [];
  
  let iframeElement: HTMLIFrameElement;

  onMount(async () => {
      window.addEventListener('message', handleMessage);
      window.addEventListener('popstate', handlePopState);
      try {
          const res = await fetch(catalogs[0]);
          if (res.ok) {
              catalogItems = await res.json();
          }
      } catch (e) {
          console.error("Failed to load catalog", e);
      }
  });

  onDestroy(() => {
      if (typeof window !== 'undefined') {
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('popstate', handlePopState);
      }
  });

  function handlePopState(event: PopStateEvent) {
      if (!event.state || event.state.vyasaViewerState !== 'package') {
          packageData = null;
          selectedWork = null;
          activeUrn = null;
      }
  }

  async function loadWork(item: any) {
      selectedWork = item.id;
      activeUrn = null;
      packageData = null;
      
      // Push state so browser back button returns to catalog
      history.pushState({ vyasaViewerState: 'package' }, '');
      
      if (item.payloadUrl) {
          try {
              const catalogBase = catalogs[0].substring(0, catalogs[0].lastIndexOf('/') + 1);
              const payloadFullUrl = item.payloadUrl.startsWith('http') || item.payloadUrl.startsWith('/') 
                                     ? item.payloadUrl 
                                     : catalogBase + item.payloadUrl;
              
              const res = await fetch(payloadFullUrl);
              if (res.ok) {
                  const arrayBuffer = await res.arrayBuffer();
                  
                  // Unzip synchronously for now, since views are small enough
                  const unzipped = fflate.unzipSync(new Uint8Array(arrayBuffer));
                  
                  const manifestStr = fflate.strFromU8(unzipped['manifest.json']);
                  const structureStr = fflate.strFromU8(unzipped['structure.json']);
                  
                  const manifest = JSON.parse(manifestStr);
                  const structure = JSON.parse(structureStr);
                  
                  const projections: Record<string, string> = {};
                  const viewSet = new Set<string>();
                  
                  for (const [path, data] of Object.entries(unzipped)) {
                      if (path.startsWith('projections/') && path.endsWith('.html') && data.length > 0) {
                          const relPath = path.substring('projections/'.length);
                          // Only register root level files in projections as "Views" (collections)
                          if (!relPath.includes('/')) {
                              viewSet.add(relPath.replace('.html', ''));
                          }
                          projections[relPath] = fflate.strFromU8(data);
                      }
                  }
                  
                  availableViews = Array.from(viewSet);
                  
                  packageData = { manifest, structure, projections };
                  
                  if (availableViews.includes('reference')) activeView = 'reference';
                  else if (availableViews.length > 0) activeView = availableViews[0];
              }
          } catch (e) {
              console.error("Failed to unpack vyview package", e);
          }
      }
  }

  function goBackToCatalog() {
      history.back();
  }

  function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'VYASA_NAVIGATE') {
          handleNavigation(event.data.href);
      }
  }

  function handleNavigation(href: string) {
      const parts = href.split('?');
      const urn = parts[0];
      
      let viewChanged = false;
      if (parts.length > 1) {
          const params = new URLSearchParams(parts[1]);
          const view = params.get('view');
          if (view && view !== activeView && availableViews.includes(view)) {
              activeView = view;
              viewChanged = true;
          }
      }
      
      activeUrn = urn;
      
      if (!viewChanged && iframeElement && iframeElement.contentWindow) {
          iframeElement.contentWindow.postMessage({ type: 'VYASA_SCROLL', id: urn }, '*');
      }
  }

  // Inject the message bridge into the HTML
  $: rawHtml = packageData ? packageData.projections[`${activeView}.html`] : '';
  $: srcdocContent = rawHtml ? injectBridge(rawHtml) : '';

  // When srcdoc changes (view changes), wait for the iframe to load to send the scroll message
  function onIframeLoad() {
      if (activeUrn && iframeElement && iframeElement.contentWindow) {
          setTimeout(() => {
              iframeElement.contentWindow?.postMessage({ type: 'VYASA_SCROLL', id: activeUrn }, '*');
          }, 100);
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
</script>

<div class="vyasa-viewer">
   <div class="sidebar">
      {#if !packageData}
          <h3>Vyasa Catalog</h3>
          <ul class="catalog-list">
          {#each catalogItems as item}
              <li>
                  <button on:click={() => loadWork(item)}>{item.name}</button>
                  {#if !item.payloadUrl}
                      <span class="error">(No Viewer Payload)</span>
                  {/if}
              </li>
          {/each}
          </ul>
      {:else}
          <button class="back-btn" on:click={goBackToCatalog}>&larr; Back to Catalog</button>
          
          <div class="view-selector">
             <label><strong>Projection:</strong></label>
             <select bind:value={activeView}>
                 {#each availableViews as view}
                     <option value={view}>{view}</option>
                 {/each}
             </select>
          </div>

          <h3>Table of Contents</h3>
          <ul class="toc-list">
             {#if packageData.structure?.urns && packageData.structure.urns.length > 0}
                 {#each packageData.structure.urns as urn}
                     <li>
                        <a href="{urn.id}?view={activeView}" on:click={(e) => { e.preventDefault(); handleNavigation(urn.id + '?view=' + activeView); }}>
                            {urn.title !== 'Untitled' ? urn.title : urn.id.replace(/^urn:[^:]+:[^:]+:/, '').replace(':', '.')}
                        </a>
                     </li>
                 {/each}
             {:else}
                 <li>No chapters/verses found.</li>
             {/if}
          </ul>
      {/if}
   </div>
   
   <div class="content-pane">
      {#if srcdocContent}
         <iframe 
            bind:this={iframeElement}
            srcdoc={srcdocContent} 
            title="Vyasa Content"
            on:load={onIframeLoad}
         ></iframe>
      {:else if selectedWork}
         <p>Loading vyview package...</p>
      {:else}
         <div class="placeholder">Select a work from the catalog to begin reading.</div>
      {/if}
   </div>
</div>

<style>
  .vyasa-viewer {
      display: flex;
      height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      overflow: hidden;
      color: #334155;
      text-align: left;
  }
  .sidebar {
      width: 250px;
      border-right: 1px solid #e2e8f0;
      padding: 1.5rem;
      background: #f8fafc;
      overflow-y: auto;
      flex-shrink: 0;
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
  h3 {
      font-size: 1.1rem;
      margin-top: 0;
      margin-bottom: 1rem;
      color: #0f172a;
  }
  .catalog-list {
      list-style: none;
      padding: 0;
  }
  .catalog-list li {
      margin-bottom: 0.5rem;
  }
  .catalog-list button {
      background: none;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 1rem;
      width: 100%;
      text-align: left;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      color: #0f172a;
  }
  .catalog-list button:hover {
      background: #e2e8f0;
  }
  .error {
      font-size: 0.8rem;
      color: #ef4444;
      display: block;
      margin-top: 0.2rem;
  }
  .back-btn {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      padding: 0;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
  }
  .back-btn:hover {
      text-decoration: underline;
  }
  .view-selector {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
  }
  .view-selector select {
      display: block;
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
  }
  .toc-list {
      list-style: none;
      padding: 0;
  }
  .toc-list li {
      margin-bottom: 0.5rem;
  }
  .toc-list a {
      color: #3b82f6;
      text-decoration: none;
  }
  .toc-list a:hover {
      text-decoration: underline;
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
