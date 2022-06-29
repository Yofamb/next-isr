import { withUrqlClient, initUrqlClient } from 'next-urql';
import { ssrExchange, dedupExchange, cacheExchange, fetchExchange, useQuery } from 'urql';

import Link from 'next/link'

const GRAPH_URL = 'https://graphql-pokemon2.vercel.app/'

const POKEMONS_QUERY = `
  query firstTwentyPokemons {
    pokemons(first: 20) {
      image
      name
    }
  }
`

const IndexPage = () => {
  const [res] = useQuery({ query: POKEMONS_QUERY });

  if(!res.data) return <div>loading</div>

  return (
    <ul>
      {res.data.pokemons.map((pokemon) => (
        <li key={pokemon.name}>
          <Link as={`/pokemon/${pokemon.name}`} href="/pokemon/[name]">
            <a>
              <h2 style={{ textTransform: 'capitalize' }}>{pokemon.name}</h2>
              <img src={pokemon.image} alt={`${pokemon.name} picture`} />
            </a>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export const getStaticProps = async () => {
  const ssrCache = ssrExchange({ isClient: false });
  const client = initUrqlClient({
    url: GRAPH_URL,
    exchanges: [dedupExchange, cacheExchange, ssrCache, fetchExchange],
  }, false);


  // This query is used to populate the cache for the query
  // used on this page.
  await client.query(POKEMONS_QUERY).toPromise();

  return {
    props: {
      // urqlState is a keyword here so withUrqlClient can pick it up.
      urqlState: ssrCache.extractData(),
    },
    revalidate: 600,
  };
}

export default withUrqlClient(
  ssr => ({
    url: GRAPH_URL,
  }),
  { ssr: false } // Important so we don't wrap our component in getInitialProps
)(IndexPage);