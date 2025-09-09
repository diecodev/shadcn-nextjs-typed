import { useRouter as useNextRouter } from "next/navigation";
import type { ParamMap } from "@/.next/types/routes";

// Derive route types from Next.js generated ParamMap
type Href = keyof ParamMap;
type HrefsWithoutParams = {
  [K in Href]: ParamMap[K] extends Record<string, never> ? K : never;
}[Href];
type HrefsWithParams = Exclude<Href, HrefsWithoutParams>;

// Navigation options subset we support (mirrors next/navigation types we need)
type NavOptions = {
  readonly scroll?: boolean;
};

// Precompiled regex for performance & lint compliance
const dynamicSegmentRegex = /\[(\.\.\.)?([A-Za-z0-9_]+)\]/g;
const unresolvedBracketsRegex = /\[|\]/;

function buildDynamicHref(
  pattern: string,
  params: Record<string, unknown> | undefined,
): string {
  if (!params || Object.keys(params).length === 0) {
    return pattern;
  }
  const missing: string[] = [];
  const result = pattern.replace(
    dynamicSegmentRegex,
    (match, dots: string | undefined, name: string) => {
      const value = params[name];
      if (dots) {
        if (!Array.isArray(value)) {
          throw new Error(
            `Expected catch-all param "${name}" to be string[] for route ${pattern}`,
          );
        }
        if (value.length === 0) {
          missing.push(name);
          return match;
        }
        return value.map((v) => encodeURIComponent(String(v))).join("/");
      }
      if (value == null || Array.isArray(value)) {
        missing.push(name);
        return match;
      }
      return encodeURIComponent(String(value));
    },
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required route param(s): ${missing.join(", ")} for pattern ${pattern}`,
    );
  }
  if (unresolvedBracketsRegex.test(result)) {
    throw new Error(
      `Unresolved dynamic segment(s) remain in built href: ${result}`,
    );
  }
  return result;
}

// Overload sets for push / replace / prefetch
type PushWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: NavOptions & { readonly params: ParamMap[H] },
  ): void;
  (href: HrefsWithoutParams, options?: NavOptions): void;
};

type ReplaceWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: NavOptions & { readonly params: ParamMap[H] },
  ): void;
  (href: HrefsWithoutParams, options?: NavOptions): void;
};

type PrefetchWithParamsFn = {
  <H extends HrefsWithParams>(
    href: H,
    options: { readonly params: ParamMap[H] },
  ): Promise<void> | void;
  (href: HrefsWithoutParams, options?: undefined): Promise<void> | void;
};

export type TypedRouter = {
  push: PushWithParamsFn;
  replace: ReplaceWithParamsFn;
  prefetch: PrefetchWithParamsFn;
  back(): void;
  forward(): void;
  refresh(): void;
};

/**
 * ### useRouter but fully typed (tanstack router inspired):
 *
 * code example
 *
 * ```tsx
 * const router = useRouter();
 * router.replace('/o/[orgSlug]', {
 *   params: { orgSlug: 'my-org' },
 *   scroll: true
 * });
 * ```
 */
export function useTypedRouter(): TypedRouter {
  const r = useNextRouter();

  const push: PushWithParamsFn = (
    href: string,
    options?: NavOptions & { params?: Record<string, unknown> },
  ) => {
    const built = buildDynamicHref(href, options?.params);
    const { params: _ignore, ...nav } = options ?? {};
    r.push(built as never, nav);
  };

  const replace: ReplaceWithParamsFn = (
    href: string,
    options?: NavOptions & { params?: Record<string, unknown> },
  ) => {
    const built = buildDynamicHref(href, options?.params);
    const { params: _ignore, ...nav } = options ?? {};
    r.replace(built as never, nav);
  };

  const prefetch: PrefetchWithParamsFn = (
    href: string,
    options?: { params?: Record<string, unknown> },
  ) => {
    const built = buildDynamicHref(href, options?.params);
    return r.prefetch(built as never);
  };

  return {
    push,
    replace,
    prefetch,
    back: r.back,
    forward: r.forward,
    refresh: r.refresh,
  };
}
