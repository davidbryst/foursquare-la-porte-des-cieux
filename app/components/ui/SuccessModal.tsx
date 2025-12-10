interface SuccessModalProps {
  show: boolean
  imageUrl?: string
}

export default function SuccessModal({ show, imageUrl = "https://image2url.com/images/1764245302200-f488f2be-dab8-46eb-903d-2772ba87c812.jpg" }: SuccessModalProps) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/60 z-[9999] p-4 animate-fadeIn">
      <div className="animate-slideIn">
        <img
          src={imageUrl}
          alt="Success"
          className="w-full max-w-[300px] sm:max-w-[340px] rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  )
}
