import Cadastrar from '../cadastrar/cadastrar.jsx'

export default function Editar({ property, onCancel, onSuccess }) {
  return (
    <Cadastrar
      onCancel={onCancel}
      onSuccess={onSuccess}
      property={property}
    />
  )
}
