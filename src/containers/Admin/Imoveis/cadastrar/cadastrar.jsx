import { useState } from 'react'
import './cadastrar.css'

import { api } from '../../../../services/api.js'

const propertyTypes = [
  'Apartamento',
  'Casa',
  'Casa em condomínio',
  'Kitnet',
  'Loft',
  'Sala comercial',
  'Terreno',
]

function Field({ label, children, className = '' }) {
  return (
    <label className={`register-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function SelectField({
  label,
  children,
  className = '',
  name,
  required = false,
  defaultValue = '',
}) {
  return (
    <Field label={label} className={className}>
      <select defaultValue={defaultValue} name={name} required={required}>
        <option value="">Selecione</option>
        {children}
      </select>
    </Field>
  )
}

function RadioOptions({ label, name, value = 'sim' }) {
  return (
    <fieldset className="register-radio-group">
      <legend>{label}</legend>
      <label><input defaultChecked={value === 'sim'} name={name} type="radio" value="sim" /> Sim</label>
      <label><input defaultChecked={value === 'nao'} name={name} type="radio" value="nao" /> Não</label>
      <label><input defaultChecked={value === 'nao-informar'} name={name} type="radio" value="nao-informar" /> Não Informar</label>
    </fieldset>
  )
}

function FormSection({ title, children, className = '' }) {
  return (
    <section className={`register-section ${className}`}>
      <h2>{title}<span aria-hidden="true">−</span></h2>
      {children}
    </section>
  )
}

export default function Cadastrar({ onCancel, onSuccess, property }) {
  const [saveMessage, setSaveMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const address = property?.address && typeof property.address === 'object'
    ? property.address
    : property
  const getValue = (name, alias, fallback = '') => (
    property?.[name] ?? (alias ? property?.[alias] : undefined) ?? address?.[name] ?? fallback
  )
  const propertyPurpose = getValue('purpose', 'businessType')
  const originalPrice = propertyPurpose?.toLowerCase().includes('alug')
    ? getValue('rent_price', 'rentPrice', getValue('price'))
    : getValue('sale_price', 'salePrice', getValue('price'))
  const originalStatus = getValue('property_status', 'status')
  const formStatus = ({
    AVAILABLE: 'Ativo',
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SOLD: 'Vendido',
    RENTED: 'Alugado',
  })[originalStatus] ?? originalStatus

  function getRadioValue(value) {
    if (value === true || value === 'true') return 'sim'
    if (value === false || value === 'false') return 'nao'
    return 'nao-informar'
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaveMessage('')

    const formData = new FormData(event.currentTarget)
    const numberOrNull = (name) => {
      const value = formData.get(name)
      return value === null || value === '' ? null : Number(value)
    }
    const textOrNull = (name) => {
      const value = String(formData.get(name) ?? '').trim()
      return value || null
    }
    const propertyData = {
      purpose: formData.get('purpose'),
      type: formData.get('type'),
      subType: textOrNull('subType'),
      status: formData.get('status'),
      searchCode: textOrNull('searchCode'),
      showOnPortal: formData.get('showOnPortal') === 'on',
      portalHighlight: formData.get('portalHighlight') === 'on',
    
      zipCode: textOrNull('zipCode'),
      country: textOrNull('country'),
      state: formData.get('state'),
      city: textOrNull('city'),
      neighborhood: textOrNull('neighborhood'),
      street: textOrNull('street'),
      number: textOrNull('number'),
      complement: textOrNull('complement'),
      condominium: textOrNull('condominium'),
      building: textOrNull('building'),
      newBuilding: textOrNull('newBuilding'),
      reference: textOrNull('reference'),
      showComplement: formData.get('showComplement') === 'on',
      showReference: formData.get('showReference') === 'on',
    
      price: numberOrNull('price'),
      condoFee: numberOrNull('condoFee'),
      premium: numberOrNull('premium'),
      outstandingBalance: numberOrNull('outstandingBalance'),
      propertyTax: numberOrNull('propertyTax'),
      showPremium: formData.get('showPremium') === 'sim',
      acceptsFinancing: formData.get('financing') === 'sim',
      acceptsFgts: formData.get('fgts') === 'sim',
      bedrooms: numberOrNull('bedrooms'),
      suites: numberOrNull('suites'),
      bathrooms: numberOrNull('bathrooms'),
      maidRooms: numberOrNull('maidRooms'),
      garages: numberOrNull('garages'),
      elevator: formData.get('elevator') || null,
      usableArea: numberOrNull('usableArea'),
      useful_area: numberOrNull('useful_area'),
      floor: numberOrNull('floor'),
      unit: textOrNull('unit'),
      title: textOrNull('title'),
      description: textOrNull('description'),
    }
    const requestData = new FormData()
    const requestProperty = property
      ? {
          title: propertyData.title,
          purpose: propertyData.purpose,
          property_status: propertyData.status,
          sale_price: propertyData.purpose?.toLowerCase().includes('alug') ? null : propertyData.price,
          rent_price: propertyData.purpose?.toLowerCase().includes('alug') ? propertyData.price : null,
          condo_fee: propertyData.condoFee,
          annual_property_tax: propertyData.propertyTax,
          useful_area: propertyData.usableArea ?? propertyData.useful_area,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          parking_spaces: propertyData.garages,
          zip_code: propertyData.zipCode,
          address: propertyData.street,
          number: propertyData.number,
          complement: propertyData.complement,
          neighborhood: propertyData.neighborhood,
          city: propertyData.city,
          state: propertyData.state,
        }
      : propertyData

    Object.entries(requestProperty).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        requestData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    })
    formData.getAll('files').forEach((file) => {
      requestData.append('files', file)
    })

    try {
      setIsSubmitting(true)
      if (property) {
        const propertyId = property.id ?? property._id
        if (!propertyId) {
          throw new Error('Não foi possível identificar o imóvel para edição.')
        }
        await api.put(`/properties/${propertyId}`, requestData)
      } else {
        await api.post('/properties', requestData)
      }
      onSuccess?.()
    } catch (error) {
      const responseMessage = error.response?.data?.error ?? error.response?.data?.message
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(' ')
        : typeof responseMessage === 'string'
          ? responseMessage
          : error.request
            ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
            : error.message || 'Não foi possível cadastrar o imóvel.'

      setSaveMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-page">
      <div className="page-header register-page-header">
        <div className="header-title-wrap">
          <h1><span aria-hidden="true">▣</span> {property ? 'Editar Imóvel' : 'Novo Imóvel'}</h1>
          <span>{property ? 'Atualize os dados do imóvel' : 'Cadastre um novo imóvel'}</span>
        </div>
        <div className="breadcrumbs" aria-label="Navegação de página">
          <span>Imobly Painel</span>
          <span>›</span>
          <span>Imóveis</span>
          <span>›</span>
          <span>{property ? 'Editar' : 'Cadastrar'}</span>
        </div>
      </div>

      <form className="register-form" key={property?.id ?? 'new-property'} onSubmit={submitForm}>
        <FormSection title="Dados Básicos">
          <div className="register-grid basic-grid">
            <SelectField defaultValue={propertyPurpose} label="Negócio *" name="purpose" required>
              <option>Venda</option>
              <option>Aluguel</option>
              <option>Temporada</option>
            </SelectField>
            <SelectField defaultValue={getValue('type')} label="Tipo *" name="type" required>
              {propertyTypes.map((type) => <option key={type}>{type}</option>)}
            </SelectField>
            <SelectField defaultValue={getValue('subType')} label="SubTipo" name="subType">
              <option>Padrão</option>
              <option>Cobertura</option>
              <option>Duplex</option>
              <option>Studio</option>
            </SelectField>
            <SelectField defaultValue={formStatus} label="Situação do Cadastro *" name="status" required>
              <option>Ativo</option>
              <option>Inativo</option>
              <option>Vendido</option>
              <option>Alugado</option>
            </SelectField>
            <Field label="Cód. de Busca">
              <input defaultValue={getValue('searchCode')} name="searchCode" type="text" />
            </Field>
          </div>
          <div className="portal-options">
            <label className="portal-toggle">
              <input defaultChecked={getValue('showOnPortal', null, true)} name="showOnPortal" type="checkbox" />
              <span>✓ &nbsp; Exibir no Portal</span>
            </label>
            <label className="portal-toggle portal-toggle-muted">
              <input defaultChecked={getValue('portalHighlight')} name="portalHighlight" type="checkbox" />
              <span>Super Destaque no Portal</span>
            </label>
            <button className="status-new" type="button">Novo</button>
            <button className="status-suspended" type="button">Mansão Suspensa</button>
          </div>
        </FormSection>

        <FormSection title="Endereço">
          <div className="register-grid address-grid">
            <Field className="cep-field" label="Cep *">
              <span className="cep-input-wrap">
                <input defaultValue={getValue('zip_code', 'zipCode')} inputMode="numeric" name="zipCode" required type="text" />
                <button className="cep-search" type="button">⌕ Buscar Cep</button>
              </span>
            </Field>
            <Field label="País *">
              <input className="input-disabled" defaultValue={getValue('country', null, 'Brasil')} name="country" readOnly />
            </Field>
            <Field label="Uf *">
              <select defaultValue={getValue('state')} name="state" required>
                <option value="">Selecione</option>
                <option>DF</option>
                <option>GO</option>
                <option>MG</option>
                <option>SP</option>
              </select>
            </Field>
            <Field label="Cidade *">
              <input defaultValue={getValue('city')} name="city" required />
            </Field>
            <Field label="Bairro *">
              <input defaultValue={getValue('neighborhood')} name="neighborhood" required />
            </Field>
            <Field label="Logradouro *">
              <input defaultValue={getValue('address', 'street')} name="street" required />
            </Field>
            <Field label="Condomínio">
              <input defaultValue={getValue('condominium')} name="condominium" />
            </Field>
            <Field label="Nº">
              <input className="narrow-input" defaultValue={getValue('number')} name="number" type="text" />
            </Field>
            <Field label="Complemento">
              <input defaultValue={getValue('complement')} name="complement" type="text" />
            </Field>
            <SelectField defaultValue={getValue('building')} label="Edifício (Selecione ou informe um novo edifício)" name="building">
              <option>Edifício</option>
            </SelectField>
            <Field label="Edifício Não Encontrado? Cadastre um Novo">
              <input defaultValue={getValue('newBuilding')} name="newBuilding" type="text" />
            </Field>
            <Field label="Ponto de Referência">
              <input defaultValue={getValue('reference')} name="reference" placeholder="Ex: Ao lado da estação do metrô." type="text" />
            </Field>
          </div>
          <div className="address-options">
            <label><input defaultChecked={getValue('showComplement')} name="showComplement" type="checkbox" /> Exibir Complemento do Endereço</label>
            <label><input defaultChecked={getValue('showReference')} name="showReference" type="checkbox" /> Exibir Ponto de Referência</label>
          </div>
        </FormSection>

        <FormSection title="Valores">
          <div className="register-grid values-grid">
            <Field label="Valor *"><input defaultValue={originalPrice} inputMode="decimal" min="0" name="price" required step="0.01" type="number" /></Field>
            <Field label="Condomínio"><input defaultValue={getValue('condo_fee', 'condoFee')} inputMode="decimal" min="0" name="condoFee" step="0.01" type="number" /></Field>
            <Field label="Ágio"><input defaultValue={getValue('premium')} inputMode="decimal" min="0" name="premium" step="0.01" type="number" /></Field>
            <Field label="Saldo Devedor"><input defaultValue={getValue('outstandingBalance')} inputMode="decimal" min="0" name="outstandingBalance" step="0.01" type="number" /></Field>
            <Field label="IPTU"><input defaultValue={getValue('annual_property_tax', 'annualPropertyTax', getValue('propertyTax'))} inputMode="decimal" min="0" name="propertyTax" step="0.01" type="number" /></Field>
          </div>
          <div className="register-grid radio-grid">
            <RadioOptions label="Exibir Ágio" name="showPremium" value={getRadioValue(getValue('showPremium'))} />
            <RadioOptions label="Aceita Financiamento" name="financing" value={getRadioValue(getValue('acceptsFinancing'))} />
            <RadioOptions label="Aceita FGTS" name="fgts" value={getRadioValue(getValue('acceptsFgts'))} />
          </div>
        </FormSection>

        <FormSection title="Características">
          <div className="register-grid feature-grid">
            <Field label="Quartos *"><input defaultValue={getValue('bedrooms', null, 0)} min="0" name="bedrooms" required type="number" /></Field>
            <Field label="Suítes *"><input defaultValue={getValue('suites')} min="0" name="suites" required type="number" /></Field>
            <Field label="Banheiro"><input defaultValue={getValue('bathrooms', null, 0)} min="0" name="bathrooms" type="number" /></Field>
            <Field label="D.C.E."><input defaultValue={getValue('maidRooms')} min="0" name="maidRooms" type="number" /></Field>
            <Field label="Garagem"><input defaultValue={getValue('parking_spaces', 'parkingSpaces', getValue('garages', null, 0))} min="0" name="garages" type="number" /></Field>
            <Field label="Elevador"><select defaultValue={getValue('elevator')} name="elevator"><option value="">Selecione</option><option>Sim</option><option>Não</option></select></Field>
            <Field label="Área útil (m²)"><input defaultValue={getValue('useful_area', 'usefulArea', getValue('usableArea'))} inputMode="decimal" min="0" name="usableArea" step="0.01" type="number" /></Field>
            <Field label="Área total (m²)"><input defaultValue={getValue('totalArea')} inputMode="decimal" min="0" name="useful_area" step="0.01" type="number" /></Field>
            <Field label="Andar"><input defaultValue={getValue('floor')} min="0" name="floor" type="number" /></Field>
            <Field label="Unidade"><input defaultValue={getValue('unit')} name="unit" type="text" /></Field>
          </div>
        </FormSection>

        <FormSection title="Descrição">
          <div className="register-grid description-grid">
            <Field className="full-width-field" label="Título do anúncio *">
              <input defaultValue={getValue('title')} maxLength="120" name="title" required type="text" />
            </Field>
            <Field className="full-width-field" label="Descrição do imóvel *">
              <textarea defaultValue={getValue('description')} name="description" required rows="5" />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Fotos do imóvel">
          <div className="register-grid description-grid">
            <Field className="full-width-field" label="Adicionar fotos">
              <input
                accept="image/*"
                multiple
                name="files"
                onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                type="file"
              />
              {selectedFiles.length > 0 && (
                <span className="selected-files">
                  {selectedFiles.map((file) => file.name).join(', ')}
                </span>
              )}
              {property?.media?.length > 0 && (
                <span className="selected-files">
                  {property.media.length} foto(s) já cadastrada(s); novas fotos serão adicionadas.
                </span>
              )}
            </Field>
          </div>
        </FormSection>

        <div className="register-footer">
          {saveMessage && <p className="register-save-message" role="status">{saveMessage}</p>}
          <button className="register-cancel" onClick={onCancel} type="button">Cancelar</button>
          <button className="register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Salvando…' : property ? 'Atualizar imóvel' : 'Salvar imóvel'}
          </button>
        </div>
      </form>
    </div>
  )
}