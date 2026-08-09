export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h1>RestaurantFlow - Redireccionando...</h1>
      <script>
        {`window.location.href = '/login';`}
      </script>
    </div>
  );
}
