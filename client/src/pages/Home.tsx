import { useQuery } from '@apollo/client';
//import ProfileList from '../components/ProfileList';
import { QUERY_PROFILES } from '../utils/queries';
import ProfileList from '../components/Profilelist';
import  '../styles/home.css';
const Home = () => {
  const { loading, data } = useQuery(QUERY_PROFILES);
  const profiles = data?.profiles || [];

  return (
    <main className = "home-container">


      {/* Overlay with content */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '100%',
        }}
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ProfileList
           
            
          />
        )}
      </div>
    </main>
  );
};

export default Home;
