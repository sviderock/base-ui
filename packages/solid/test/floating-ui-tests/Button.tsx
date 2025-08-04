import c from 'clsx';
import { type JSX } from 'solid-js';

/** @internal */
export function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      class={c(
        props.class,
        'bg-slate-200/90 hover:bg-slate-200/50 data-[open]:bg-slate-200/50 rounded p-2 px-3 transition-colors',
      )}
    />
  );
}
