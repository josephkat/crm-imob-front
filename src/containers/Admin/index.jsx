import { useState } from 'react'
import './admin.css'
import Cadastrar from './Imoveis/cadastrar/cadastrar.jsx'
import Editar from './Imoveis/editar/editar.jsx'
import Listar from './Imoveis/listar/listar.jsx'
import useLoggedInUser from '../../hooks/useLoggedInUser.js'

const navigation = [
  { icon: '◫', label: 'Meu Painel' },
  { icon: '⌂', label: 'Imóveis', active: true },
  { icon: '◧', label: 'Imóveis Novos (Lançamentos)' },
  { icon: '⌂', label: 'Imóveis Seguros' },
  { icon: '↗', label: 'Imóveis Assinados' },
]

const crmNavigation = [
  { icon: '◫', label: 'SmartLead/Contatos', badge: '1.072' },
  { icon: '◉', label: 'Atendimentos', badge: '3' },
  { icon: '✉', label: 'E-mails/Conversas', badge: '8.401' },
  { icon: '◫', label: 'Clientes' },
  { icon: '◔', label: 'Visitas Agendadas' },
  { icon: '◫', label: 'Propostas', badge: '99' },
]

const otherNavigation = [
  { icon: '▣', label: 'Permuta Gestão', badge: 'NOVO', badgeBlue: '2' },
  { icon: '▤', label: 'Relatórios' },
  { icon: '◫', label: 'Evolução de Mercado 2.0', badge: 'Beta' },
  { icon: '◌', label: 'Meu Site' },
  { icon: '◎', label: 'Corretores' },
  { icon: '◍', label: 'Funcionários' },
  { icon: '▧', label: 'Faturas' },
  { icon: '◫', label: 'Portais Imobiliários' },
  { icon: '↥', label: 'Exportação de Imóveis' },
  { icon: '✦', label: 'Marca D’água' },
  { icon: '◬', label: 'Meus Dados' },
  { icon: '◔', label: 'Suporte (Atendimento)' },
]


function SidebarLink({ item, onClick }) {
  return (
    <button className={`nav-item ${item.active ? 'active' : ''}`} onClick={onClick} type="button">
      <span className="nav-icon" aria-hidden="true">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
      {item.badgeBlue && <span className="nav-badge nav-badge-blue">{item.badgeBlue}</span>}
    </button>
  )
}

export default function Admin() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [propertyToEdit, setPropertyToEdit] = useState(null)
  const user = useLoggedInUser()

  function showPropertyList() {
    setPropertyToEdit(null)
    setIsRegistering(false)
  }

  function logOut() {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('user')
    window.sessionStorage.removeItem('token')
    window.sessionStorage.removeItem('user')
    window.location.assign('/')
  }

  return (
    <div className="imovel-dashboard">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-name">Imobly Imoveis</span>
          <span className="brand-panel">Painel</span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <div className="nav-group">
            {navigation.map((item) => (
              <SidebarLink
                item={item}
                key={item.label}
                onClick={item.label === 'Imóveis' ? showPropertyList : undefined}
              />
            ))}
          </div>

          <div className="nav-section-header">
            <span>CRM</span>
            <span className="collapse-arrow">‹</span>
          </div>




          <div className="nav-group extra-group">
            {otherNavigation.map((item) => (
              <SidebarLink item={item} key={item.label} />
            ))}
          </div>
        </nav>

        <button className="sidebar-logout" onClick={logOut} type="button">
          <span className="logout-icon">↪</span>
          <span>Sair</span>
        </button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="menu-button" type="button" aria-label="Abrir menu">
            ☰
          </button>

          <div className="user-pill" aria-label="Usuário atual">
            <span className="avatar-circle">◔</span>
            <span className="user-name" title={user?.name}>{user?.name ?? 'JDM IMÓVEIS'}</span>
          </div>
        </header>

        <div className="page-content">
          {propertyToEdit ? (
            <Editar
              property={propertyToEdit}
              onCancel={showPropertyList}
              onSuccess={showPropertyList}
            />
          ) : isRegistering ? (
            <Cadastrar
              onCancel={showPropertyList}
              onSuccess={showPropertyList}
            />
          ) : (
            <Listar
              onAddProperty={() => setIsRegistering(true)}
              onEditProperty={(property) => setPropertyToEdit(property)}
            />
          )}

          <button type="button" className="floating-support" aria-label="Suporte">
            ?
          </button>
        </div>
      </main>
    </div>
  )
}
