import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login.jsx';
import { Registro } from '../pages/Registro.jsx';
import { Dashboard } from '../pages/Dashboard.jsx';
import { ClientesPage } from '../pages/ClientesPage.jsx';
import { ServiciosPage } from '../pages/ServiciosPage.jsx';
import { EventosPage } from '../pages/EventosPage.jsx';
import { DetalleEventosPage } from '../pages/DetalleEventosPage.jsx';
import { UsuariosPage } from '../pages/UsuariosPage.jsx';
import { RolesPage } from '../pages/RolesPage.jsx';
import { ClientePortalPage } from '../pages/ClientePortalPage.jsx';
import { PerfilPage } from '../pages/PerfilPage.jsx';
import { CalendarioPage } from '../pages/CalendarioPage.jsx';
import { RutaProtegida } from '../components/RutaProtegida.jsx';
import { Layout } from '../components/Layout.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Rutas Protegidas dentro del Layout */}
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Layout>
              <Dashboard />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/clientes"
        element={
          <RutaProtegida allowedRoles={['administrador', 'supervisor']}>
            <Layout>
              <ClientesPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/servicios"
        element={
          <RutaProtegida>
            <Layout>
              <ServiciosPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/eventos"
        element={
          <RutaProtegida>
            <Layout>
              <EventosPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/detalle-eventos"
        element={
          <RutaProtegida>
            <Layout>
              <DetalleEventosPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/usuarios"
        element={
          <RutaProtegida allowedRoles={['administrador']}>
            <Layout>
              <UsuariosPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/roles"
        element={
          <RutaProtegida allowedRoles={['administrador']}>
            <Layout>
              <RolesPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/calendario"
        element={
          <RutaProtegida>
            <Layout>
              <CalendarioPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/portal-cliente"
        element={
          <RutaProtegida allowedRoles={['cliente']}>
            <Layout>
              <ClientePortalPage />
            </Layout>
          </RutaProtegida>
        }
      />

      <Route
        path="/perfil"
        element={
          <RutaProtegida>
            <Layout>
              <PerfilPage />
            </Layout>
          </RutaProtegida>
        }
      />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

