import './App.css';
import React, { useState, useEffect } from 'react';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    // Verificamos si el usuario está autenticado al cargar la aplicación
    async function cargarUsuario() {
      try {
        const respuesta = await fetch('/api/me');
        
        if (respuesta.status === 401) {
          // Si la API devuelve 401, el usuario no está logeado en Azure
          setUsuario(null);
        } else if (respuesta.ok) {
          const datos = await respuesta.json();
          setUsuario(datos);
        } else {
          setError('Error al obtener los datos del servidor.');
        }
      } catch (err) {
        setError('No se pudo conectar con la API.');
      } finally {
        setCargando(false);
      }
    }

    cargarUsuario();
  }, []);

   if (cargando) {
    return <p style={{ padding: '20px' }}>Cargando sesión...</p>;
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1>ZEGEL - Azure Static Web Apps + React + Entra ID</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!usuario ? (
        <div>
          <p>No has iniciado sesión de forma activa.</p>
          {/* Enlace al flujo de autenticación nativo de Azure SWA */}
          <a 
            href="/.auth/login/aad" 
            style={{ 
              padding: '10px 20px', 
              background: '#0078d4', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            Iniciar Sesión con Entra ID (AD)
          </a>
        </div>
      ) : (
        <div>
          <p>¡Bienvenido, <strong>{usuario.userDetails}</strong>!</p>
          <p>ID único del proveedor: <code>{usuario.userId}</code></p>
          
          <div style={{ marginBottom: '20px' }}>
            {/* Enlace nativo para destruir la cookie de sesión */}
            <a 
              href="/.auth/logout" 
              style={{ 
                padding: '8px 15px', 
                background: '#d83b01', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Cerrar Sesión
            </a>
          </div>

          <h3>Detalles devueltos por la API de Node.js:</h3>
          <pre style={{ background: '#f3f2f1', padding: '15px', borderRadius: '5px', overflowX: 'auto' }}>
            {JSON.stringify(usuario, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
