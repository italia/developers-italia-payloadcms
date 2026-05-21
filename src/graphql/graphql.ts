import { initGraphQLTada } from "gql.tada";
import type { introspection } from "@graphql/graphql-env";

export const graphql = initGraphQLTada<{
  introspection: introspection;
  scalars: {
    DateTime: string;
    JSON: unknown;
    JSONObject: Record<string, unknown>;
    EmailAddress: string;
  };
}>();

export type { FragmentOf, ResultOf, VariablesOf } from "gql.tada";
export { readFragment } from "gql.tada";
