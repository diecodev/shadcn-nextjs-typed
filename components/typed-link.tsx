import type { LinkRestProps } from "next/link";
import Link from "next/link";
import type { ParamMap } from "@/.next/types/routes";

type _Href = keyof ParamMap;

// If the ParamMap entry is an empty object, params is omitted; otherwise required.
export type TypedLinkProps<H extends _Href = _Href> = LinkRestProps &
  (ParamMap[H] extends Record<string, never>
    ? { href: H; params?: undefined }
    : { href: H; params: ParamMap[H] });

const dynamicSegmentRegex = /\[(\.\.\.)?([A-Za-z0-9_]+)\]/g;
const unresolvedBracketsRegex = /\[|\]/;

function buildDynamicHref<H extends _Href>(
  pattern: H,
  params: ParamMap[H],
): string {
  if (!params || Object.keys(params as object).length === 0) {
    return pattern as string;
  }
  const missing: string[] = [];
  const result = (pattern as string).replace(
    dynamicSegmentRegex,
    (match, dots: string | undefined, name: string) => {
      const value = (params as Record<string, unknown>)[name];
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

/**
 * TypedLink is a type-safe wrapper around Next.js's Link component.
 * It enforces route param correctness using your project's ParamMap type.
 *
 * ## Usage
 * - For static routes (no params): pass `href` as the route key.
 * - For dynamic routes: pass `href` and a `params` object matching the route's param shape.
 *
 * Example:
 * ```tsx
 * // Static route
 * <TypedLink href="/about" />
 *
 * // Dynamic route (e.g. /user/[id])
 * <TypedLink href="/user/[id]" params={{ id: "123" }} />
 *
 * // Catch-all route (e.g. /blog/[...slug])
 * <TypedLink href="/blog/[...slug]" params={{ slug: ["2025", "pricing"] }} />
 * ```
 *
 * This component automatically builds the correct href string and throws
 * if required params are missing or malformed.
 *
 * See also: useRouter custom implementation for programmatic navigation with type safety.
 */
export function TypedLink<H extends _Href>(props: TypedLinkProps<H>) {
  const { href, params, ...rest } = props as TypedLinkProps<_Href> & {
    href: H;
  };
  const built: string = ((): string => {
    if (params !== undefined) {
      return buildDynamicHref(href as H, params as ParamMap[H]);
    }
    return href as string;
  })();
  return <Link href={built as never} {...rest} />;
}
