/* tslint:disable */
/* eslint-disable */

export class ViewNode {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  urn: string;
  type_: string;
  content: string;
  context: string;
}

export class VyasaViewerRuntime {
  free(): void;
  [Symbol.dispose](): void;
  weave_view(rows_val: any, templates_json: string, active_view: string): Array<any>;
  build_viewport_query(start_urn: string, limit: number): string;
  constructor();
}

export function compile_workspace(files: any, template_name?: string | null): string;

export function init_hooks(): void;

export function process_string_wasm(content: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_get_viewnode_content: (a: number, b: number) => void;
  readonly __wbg_get_viewnode_context: (a: number, b: number) => void;
  readonly __wbg_get_viewnode_type_: (a: number, b: number) => void;
  readonly __wbg_get_viewnode_urn: (a: number, b: number) => void;
  readonly __wbg_set_viewnode_content: (a: number, b: number, c: number) => void;
  readonly __wbg_set_viewnode_context: (a: number, b: number, c: number) => void;
  readonly __wbg_set_viewnode_type_: (a: number, b: number, c: number) => void;
  readonly __wbg_set_viewnode_urn: (a: number, b: number, c: number) => void;
  readonly __wbg_viewnode_free: (a: number, b: number) => void;
  readonly __wbg_vyasaviewerruntime_free: (a: number, b: number) => void;
  readonly compile_workspace: (a: number, b: number, c: number, d: number) => void;
  readonly init_hooks: () => void;
  readonly process_string_wasm: (a: number, b: number, c: number) => void;
  readonly vyasaviewerruntime_build_viewport_query: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly vyasaviewerruntime_new: () => number;
  readonly vyasaviewerruntime_weave_view: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export3: (a: number) => void;
  readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
