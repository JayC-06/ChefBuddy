const Recognition = () => {
  return (
   <main
  className="recognition-container"
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  }}
>
  <div className="card" style={{ width: '400px' }}>
    <div className="card-content">
      <span className="card-title deep-orange-text">The Chef of the Week is...</span>
      <p>JOHN BROWN!!!</p>
    </div>
  </div>
</main>
  );
};

export default Recognition;