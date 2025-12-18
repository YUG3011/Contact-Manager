import ContactForm from '../../../components/ContactForm'

export default function NewContactPage() {
  return (
    <section className="grid gap-2">
      <div>
        <h2 className="font-semibold tracking-tight">New Contact</h2>
        <p className=" text-sm text-slate-600">Add a new person to your list.</p>
      </div>
      <div className="card p-6">
        <ContactForm />
      </div>
    </section>
  )
}
