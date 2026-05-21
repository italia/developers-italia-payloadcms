
import type { TadaDocumentNode } from "gql.tada";
import { print } from 'graphql';

const BASE = import.meta.env.PAYLOAD_URL
const KEY = import.meta.env.PAYLOAD_API_KEY
const hdrs = { Authorization: `users API-Key ${KEY}` }

export async function payloadFetch<T>(path: string, qs = ''): Promise<T> {
  const res = await fetch(`${BASE}/api${path}${qs ? '?' + qs : ''}`, { headers: hdrs })
  console.log('fetching', path, qs, res.status)
  if (!res.ok) throw new Error(`Payload ${res.status}: ${path}`)
  return res.json()
}

export async function gqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${BASE}/api/graphql`, {
    method: 'POST',
    headers: { ...hdrs, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`)
  const { data, errors } = await res.json()
  if (errors?.length) throw new Error(errors.map((e: { message: string }) => e.message).join(', '))
  return data
}


export async function executeQuery<Result, Variables>(
  query: TadaDocumentNode<Result, Variables>,
  options?: ExecuteQueryOptions<Variables>,

) {
  const variables = {
    ...(options?.variables as Record<string, unknown>),
    ...(options?.page !== undefined && { page: options.page }),
    ...(options?.limit !== undefined && { limit: options.limit }),
  } as Variables;
  const result = await gqlFetch(print(query), variables as Record<string, unknown>);
  console.log('executeQuery', { query: print(query), variables: options?.variables, result })
  return result;
}

type ExecuteQueryOptions<Variables> = {
  variables?: Variables;
  page?: number;
  limit?: number;
};


export async function executeAutoPagingQuery<Result, Variables>(
  query: TadaDocumentNode<Result, Variables>,
  options?: ExecuteQueryOptions<Variables>,
): Promise<Result[]> {
  const allDocs: Result[] = [];
  let page = options?.page ?? 1;
  const limit = options?.limit ?? 100;
  let hasNextPage = true;

  while (hasNextPage) {
    const variables = { ...(options?.variables as Record<string, unknown>), page, limit } as Variables;
    const result = await gqlFetch<Result>(print(query), variables);

    // Payload GraphQL wraps results: { CollectionName: { docs, hasNextPage, ... } }
    const pageData = Object.values(result as Record<string, unknown>)[0] as {
      docs: Result[];
      hasNextPage: boolean;
    };

    console.log(`executeAutoPagingQuery page ${page}`, {
      fetched: pageData.docs.length,
      hasNextPage: pageData.hasNextPage,
    });

    allDocs.push(...pageData.docs);
    hasNextPage = pageData.hasNextPage;
    page++;
  }

  return allDocs;
}
