import ContactForm from '../../../components/ContactForm'

export default function NewContactPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">New Contact</h2>
      <div className="bg-white p-4 rounded shadow-sm">
        {/* ContactForm handles client-side submission */}
        <ContactForm />
      </div>
    </div>
  )
}
