import { useEffect, useState } from 'react'
import { api } from '../../../../services/api.js'

function getPropertyList(data) {
  if (Array.isArray(data)) {
    return data
  }

  const list = [data?.properties, data?.items, data?.data].find(Array.isArray)

  if (!list) {
    throw new Error('O servidor retornou uma lista de imóveis inválida.')
  }

  return list
}

function getPropertyImage(property) {
  const media = Array.isArray(property.media) ? property.media : []
  const fileUrl = media.find((item) => item.media_type === 'PHOTO' && item.file_url)?.file_url

  if (!fileUrl) {
    return ''
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl
  }

  const normalizedPath = fileUrl.replace(/\\/g, '/')
  const uploadsIndex = normalizedPath.toLowerCase().lastIndexOf('/uploads/')
  const relativePath = uploadsIndex >= 0
    ? normalizedPath.slice(uploadsIndex + '/uploads/'.length)
    : normalizedPath.split('/').pop()
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/')
  const apiBaseUrl = new URL(api.defaults.baseURL || window.location.origin, window.location.origin)

  return new URL(`/uploads/${encodedPath}`, apiBaseUrl).toString()
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return 'Valor não informado'
  }

  const price = Number(value)
  return Number.isFinite(price)
    ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : String(value)
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR')
}

function getErrorMessage(error) {
  const responseMessage = error.response?.data?.error ?? error.response?.data?.message

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(' ')
  }

  if (typeof responseMessage === 'string') {
    return responseMessage
  }

  if (error.request) {
    return 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
  }

  return error.message || 'Não foi possível carregar os imóveis.'
}

function mapProperty(property) {
  const address = property.address && typeof property.address === 'object'
    ? property.address
    : property
  const location = [address.state, address.city, address.neighborhood, address.street ?? property.address]
    .filter(Boolean)
    .join(' - ')
  const purpose = property.purpose ?? property.businessType
  const title = property.title || property.searchCode || property.code || `Imóvel ${property.id ?? property._id}`
  const propertyStatus = property.property_status ?? property.propertyStatus ?? property.status

  return {
    id: property.id ?? property._id ?? title,
    source: property,
    title: purpose ? `${title} — ${purpose}` : title,
    neighborhood: location || 'Endereço não informado',
    detail: address.complement || address.number || property.unit || property.subType || '',
    price: formatPrice(property.price ?? property.sale_price ?? property.salePrice ?? property.rent_price ?? property.rentPrice),
    bedrooms: property.bedrooms ?? '—',
    bathrooms: property.bathrooms ?? '—',
    area: property.usableArea ?? property.useful_area ?? property.usefulArea ?? property.totalArea,
    updatedAt: formatDate(property.updatedAt ?? property.updated_at),
    createdAt: formatDate(property.createdAt ?? property.created_at),
    status: propertyStatus || 'Não informado',
    published: property.showOnPortal ? 'Publicado' : 'Não publicado',
    image: getPropertyImage(property),
  }
}

export default function Listar({ onAddProperty, onEditProperty }) {
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadProperties() {
      try {
        setIsLoading(true)
        setLoadError('')
        const response = await api.get('/properties')
        const propertyList = getPropertyList(response.data).map(mapProperty)

        if (isCurrent) {
          setProperties(propertyList)
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(getErrorMessage(error))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadProperties()

    return () => {
      isCurrent = false
    }
  }, [])

  return (
    <>
      <div className="page-header">
        <div className="header-title-wrap">
          <h1>Lista de Imóveis</h1>
          <span>Confira os seus imóveis cadastrados</span>
        </div>

        <div className="breadcrumbs" aria-label="Navegação de página">
          <span>DFimoveis.com Painel</span>
          <span>›</span>
          <span>Imóveis</span>
        </div>
      </div>

      <section className="filter-panel">
        <div className="filter-header">Filtro</div>

        <div className="filter-grid">
          <label className="field-block">
            <span>Código de Busca</span>
            <input defaultValue="Ok" />
          </label>

          <label className="field-block">
            <span>Situação do Cadastro</span>
            <select defaultValue="Ativo">
              <option>Ativo</option>
              <option>Inativo</option>
              <option>Publicado</option>
            </select>
          </label>

          <label className="field-block">
            <span>Publicado no Portal</span>
            <select defaultValue="Publicado">
              <option>Publicado</option>
              <option>Não publicado</option>
            </select>
          </label>

          <label className="field-block">
            <span>Negócio</span>
            <select defaultValue="Todos">
              <option>Todos</option>
              <option>Venda</option>
              <option>Aluguel</option>
            </select>
          </label>

          <label className="field-block">
            <span>Tipo</span>
            <select defaultValue="Todos">
              <option>Todos</option>
              <option>Apartamento</option>
              <option>Casa</option>
            </select>
          </label>

          <label className="field-block">
            <span>Super Destaque</span>
            <select defaultValue="Todos">
              <option>Todos</option>
              <option>Sim</option>
              <option>Não</option>
            </select>
          </label>
        </div>

        <div className="toolbar-actions">
          <button type="button" className="btn btn-search">Pesquisar</button>
          <button type="button" className="btn btn-ghost">Exportar para Excel</button>
          <button type="button" className="btn btn-ghost">Limpar Filtros</button>
          <button type="button" className="btn btn-primary">Filtros avançados</button>
        </div>
      </section>

      <div className="list-header">
        <h2>Lista de Imóveis</h2>
        <button type="button" className="add-property-btn" onClick={onAddProperty}>
          + Novo Imóvel
        </button>
      </div>

      <section className="property-list" aria-label="Lista de imóveis">
        {isLoading && <p role="status">Carregando imóveis…</p>}
        {!isLoading && loadError && <p role="alert">{loadError}</p>}
        {!isLoading && !loadError && properties.length === 0 && (
          <p role="status">Nenhum imóvel cadastrado.</p>
        )}
        {properties.map((property) => (
          <article
            className="property-row"
            key={property.id}
            onClick={() => onEditProperty?.(property.source)}
            onKeyDown={(event) => {
              if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onEditProperty?.(property.source)
              }
            }}
            role="button"
            tabIndex={0}
            title="Clique para editar este imóvel"
          >
            <div className="property-check" onClick={(event) => event.stopPropagation()}>
              <input type="checkbox" aria-label={`Selecionar ${property.title}`} />
            </div>

            <div className="property-image-wrap">
              {property.image && (
                <img src={property.image} alt={property.title} className="property-image" />
              )}
            </div>

            <div className="property-info">
              <h3>{property.title}</h3>
              <p className="property-neighborhood">{property.neighborhood}</p>
              <p className="property-detail">{property.detail}</p>
              <div className="property-price-row">
                <span className="price-label">{property.price}</span>
              </div>
              <div className="property-dimensions">
                <span>{property.bedrooms} quartos</span>
                <span>{property.bathrooms} banheiros</span>
                {property.area && <span>{property.area} m²</span>}
              </div>
            </div>

            <div className="property-meta">
              <div className="meta-grid">
                <span className="meta-label">Atualização</span>
                <span className="meta-value">{property.updatedAt}</span>
              </div>
              <div className="meta-grid">
                <span className="meta-label">Cadastro</span>
                <span className="meta-value">{property.createdAt}</span>
              </div>
            </div>

            <div className="property-status-col">
              <div className="status-badge-wrap">
                <span className="status-dot" />
                <span>{property.status}</span>
              </div>
              <div className="published-badge">{property.published}</div>
            </div>

            <div className="quick-actions-col" aria-label="Ações rápido">
              <button type="button" className="mini-action" onClick={() => onEditProperty?.(property.source)}>⊙</button>
              <button type="button" className="mini-action" onClick={() => onEditProperty?.(property.source)}>✎</button>
              <button type="button" className="mini-action" onClick={(event) => event.stopPropagation()}>◌</button>
              <button type="button" className="mini-action" onClick={(event) => event.stopPropagation()}>♡</button>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
