import { useState } from 'react'
import Input from './ui/Input'
import Button from './ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Tentative de connexion avec:", username)
    setErrorMsg('')
    
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Veuillez remplir tous les champs !")
      return
    }
    
    setIsLoading(true)
    try {
      await onLogin(username.trim(), password)
    } catch (error) {
      console.error("Erreur lors de la connexion:", error)
      setErrorMsg("Nom d'utilisateur ou mot de passe incorrect !")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-[#4a2b87] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <FontAwesomeIcon icon={faLock} className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-gray-800 text-xl sm:text-2xl font-semibold">
          Connexion Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Accédez à l'espace d'administration
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nom d'utilisateur"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Entrez votre identifiant"
          disabled={isLoading}
        />

        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez votre mot de passe"
          disabled={isLoading}
        />
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-[#ffebee] border border-[#ffcdd2] rounded-lg animate-fadeIn">
          <p className="text-[#c62828] text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5" />
            {errorMsg}
          </p>
        </div>
      )}

      <Button 
        type="submit" 
        fullWidth 
        className="mt-6"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Connexion...
          </span>
        ) : (
          'Se connecter'
        )}
      </Button>
    </form>
  )
}
