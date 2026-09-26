const { app } = require('@azure/functions');

/**
 * Función que devuelve la información del usuario autenticado.
 * 
 * Azure Static Web Apps inyecta la información del usuario autenticado
 * en el header "x-ms-client-principal" como un JSON codificado en Base64.
 */
app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous', // La autenticación se maneja en staticwebapp.config.json
  route: 'me',
  handler: async (request, context) => {
    context.log('🔍 Endpoint /api/me invocado');

    // ============================================
    // PASO 1: Obtener el header del cliente principal
    // ============================================
    const clientPrincipalHeader = request.headers.get('x-ms-client-principal');

    // Si no hay usuario autenticado, retornar 401
    if (!clientPrincipalHeader) {
      context.log('⚠️ No se encontró x-ms-client-principal');
      return {
        status: 401,
        jsonBody: {
          error: 'No autenticado',
          message: 'El usuario no está autenticado'
        }
      };
    }

    try {
      // ============================================
      // PASO 2: Decodificar el Base64
      // ============================================
      const clientPrincipalEncoded = clientPrincipalHeader;
      const clientPrincipalDecoded = Buffer.from(clientPrincipalEncoded, 'base64').toString('utf8');
      const clientPrincipal = JSON.parse(clientPrincipalDecoded);

      context.log(`✅ Usuario autenticado: ${clientPrincipal.userDetails}`);

      // ============================================
      // PASO 3: Extraer los claims relevantes
      // ============================================
      // Los claims vienen en un array de objetos { typ, val }
      const claims = {};
      if (clientPrincipal.claims) {
        clientPrincipal.claims.forEach(claim => {
          claims[claim.typ] = claim.val;
        });
      }

      // ============================================
      // PASO 4: Construir la respuesta con la info del usuario
      // ============================================
      const userInfo = {
        // Información básica
        userId: clientPrincipal.userId,
        userDetails: clientPrincipal.userDetails, // Email o nombre de usuario
        identityProvider: clientPrincipal.identityProvider, // "aad" para Azure AD
        userRoles: clientPrincipal.userRoles, // Roles asignados

        // Claims específicos de Azure AD
        name: claims['name'] || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        email: claims['email'] || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        givenName: claims['given_name'],
        familyName: claims['family_name'],
        tenantId: claims['tid'],
        objectId: claims['oid'],
        
        // Metadata
        authenticatedAt: new Date().toISOString(),
        rawClaimsCount: clientPrincipal.claims ? clientPrincipal.claims.length : 0
      };

      context.log(`📧 Email: ${userInfo.email}, 👤 Nombre: ${userInfo.name}`);

      // ============================================
      // PASO 5: Retornar la respuesta
      // ============================================
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: userInfo
        }
      };

    } catch (error) {
      context.error(`❌ Error procesando client principal: ${error.message}`);
      return {
        status: 500,
        jsonBody: {
          error: 'Error interno',
          message: 'No se pudo procesar la información del usuario'
        }
      };
    }
  }
});

/**
 * Función adicional: Lista todos los roles disponibles
 */
app.http('roles', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'roles',
  handler: async (request, context) => {
    const clientPrincipalHeader = request.headers.get('x-ms-client-principal');
    
    if (!clientPrincipalHeader) {
      return { status: 401, jsonBody: { error: 'No autenticado' } };
    }

    const clientPrincipal = JSON.parse(
      Buffer.from(clientPrincipalHeader, 'base64').toString('utf8')
    );

    return {
      status: 200,
      jsonBody: {
        userRoles: clientPrincipal.userRoles,
        userDetails: clientPrincipal.userDetails
      }
    };
  }
});