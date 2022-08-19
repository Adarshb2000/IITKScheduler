import { useState } from 'react'

const BinaryButton = ({ text, className, id, buttonWidth = 'w-20' }) => {
  const [checked, setChecked] = useState(true)
  return (
    <button
      className={`p-2 rounded-lg mx-1  ${buttonWidth} ${
        checked ? 'bg-green-500' : 'bg-red-500'
      }`}
      onClick={() => setChecked(!checked)}
    >
      <input
        type="checkbox"
        className={className}
        checked={checked}
        id={id}
        hidden
        onChange={() => {}}
      />
      {text}
    </button>
  )
}

export default BinaryButton
