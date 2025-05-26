import './App.css';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { client } from './apolloClient';
import { setContext } from '@apollo/client/link/context';
import { Outlet, Link } from 'react-router-dom';
import Auth from './utils/auth';

const httpLink = createHttpLink({
  uri: '/graphql',
});

// Construct request middleware that will attach the JWT token to every request as an `authorization` header
const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem('id_token');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  // Set up our client to execute the `authLink` middleware prior to making the request to our GraphQL API
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="gradient-background min-100-vh">
        <nav>
          <div className="nav-wrapper nav-gradient">
            <div className="container">
              <Link to="/" className="brand-logo">Chef Buddy</Link>
              <ul id="nav-mobile" className="right hide-on-med-and-down">
                <li><Link to="/">Home</Link></li>
                {Auth.loggedIn() ? (
                  <>
                    <li><Link to="/me">Profile</Link></li>
                    <li><a href="/" onClick={() => Auth.logout()}>Logout</a></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login">Login</Link></li>
                    <li><Link to="/signup">Signup</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </nav>
        <main className="container">
          <Outlet /> 
        </main>
        <footer className="page-footer footer-gradient">
          <div className="container">
            <div className="row">
              <div className="col l6 s12">
                <h5 className="white-text">Chef Buddy</h5>
                <p className="grey-text text-lighten-4">Your personal recipe assistant</p>
              </div>
              <div className="col l4 offset-l2 s12">
                <h5 className="white-text">Links</h5>
                <ul>
                  <li><Link to="/" className="grey-text text-lighten-3">Home</Link></li>
                  {Auth.loggedIn() && (
                    <li><Link to="/me" className="grey-text text-lighten-3">Profile</Link></li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-copyright">
            <div className="container">
            © 2025 Chef Buddy
            <a className="grey-text text-lighten-4 right" href="#!">More Links</a>
            </div>
          </div>
        </footer>
      </div>
    </ApolloProvider>
  );
}

export default App;
