import { ArrowRight, ArrowUp, Award, BadgePercent, BookOpen, Boxes, Brain, Building2, CalendarDays, Camera, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Clock, Cpu, Database, Globe2, GraduationCap, Mail, MapPin, Menu, MessageCircle, MonitorPlay, Phone, Play, ScanEye, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Target, UserCheck, Users, WalletCards, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { apiAssetUrl, apiGet, apiPost, apiUpload } from './api'
import LoadingScreen from './LoadingScreen'
import LoginParticleBackground from './LoginParticleBackground'
import './landing.css'

const programCategories = [
  'CSS & CCE Preparation',
  'Diploma Programs',
  'IT & Technology',
  'Linguistic Programs',
  'Short Courses',
]
const admissionSteps = [
  { icon: ClipboardCheck, title: 'Choose your course', detail: 'Explore our active programs and select the course that matches your goals.' },
  { icon: Send, title: 'Submit an inquiry', detail: 'Share your contact details and preferred class timing using the application form.' },
  { icon: MessageCircle, title: 'Speak with admissions', detail: 'Our admissions team will contact you to discuss eligibility, schedule, and next steps.' },
  { icon: GraduationCap, title: 'Complete enrollment', detail: 'Confirm your selected course and complete the institute enrollment process.' },
]
const admissionFaqs = [
  { question: 'How do I apply?', answer: 'Choose a course and submit the application form. The admissions team will contact you about the next steps.' },
  { question: 'How can I confirm the latest fee?', answer: 'Published course fees are shown below when available. Contact admissions to confirm the current fee and payment details.' },
  { question: 'Are scholarships or discounts available?', answer: 'Availability and eligibility can vary. Contact admissions to ask about current scholarship or discount options.' },
  { question: 'Can I choose a class timing?', answer: 'You can select a preferred morning, afternoon, or evening timing in the inquiry form. The team will confirm availability.' },
]
const teamOpportunities = {
  faculty: { type: 'FACULTY', title: 'Join Our Faculty', description: 'Share your teaching expertise with The Prime team.', detailFields: [{ name: 'expertise', label: 'Subject / area of expertise', required: true }, { name: 'experience', label: 'Teaching or industry experience', required: true }] },
  community: { type: 'COMMUNITY', title: 'Join Software House Community', description: 'Tell us how you would like to take part in our software house community.', detailFields: [{ name: 'interest', label: 'Area of interest', required: true }] },
  internship: { type: 'INTERNSHIP', title: 'Apply for Internship', description: 'Introduce yourself and the internship area you are interested in.', detailFields: [{ name: 'education', label: 'Education / current study', required: true }, { name: 'department', label: 'Preferred internship area', required: true }] },
}
const defaultLifeAtPrime = {
  eyebrow: 'Campus experience',
  titlePrefix: 'Life at',
  titleHighlight: 'The Prime.',
  description: 'Beyond lectures, a vibrant community where you grow through events, teamwork, culture, and real-world exposure.',
  categories: ['Events & societies', 'Sports & wellness', 'Student community', 'Labs & practical skills'],
  gallery: [],
}
const campusCategoryIcons = [Users, ShieldCheck, GraduationCap, CheckCircle2]

const challengeTags = [
  { icon: Users, label: 'Rapid AI adoption' },
  { icon: Sparkles, label: 'Growing digital economy' },
  { icon: Globe2, label: 'Remote-first hiring' },
  { icon: Cpu, label: 'Evolving skill demand' },
  { icon: ShieldCheck, label: 'Shortage of trained tech talent' },
]

const processSteps = [
  { number: 1, icon: BookOpen, title: 'Knowledge', detail: 'Scientific understanding and technical foundations.' },
  { number: 2, icon: Boxes, title: 'Skills', detail: 'Practical competency and hands-on expertise.' },
  { number: 3, icon: Cpu, title: 'Technology', detail: 'AI-enabled digital capabilities.' },
  { number: 4, icon: Award, title: 'Professional Excellence', detail: 'Ethical and future-ready leadership.' },
]

const aboutPoints = [
  { icon: GraduationCap, title: 'Academic Excellence', detail: 'Programmes aligned with industry requirements.' },
  { icon: UserCheck, title: 'Practical Competency', detail: 'Hands-on learning through industry placements.' },
  { icon: Cpu, title: 'Digital Transformation', detail: 'Emerging technologies integrated into every course.' },
  { icon: Sparkles, title: 'Research & Innovation', detail: 'Encouraging applied research and new solutions.' },
  { icon: Globe2, title: 'Global Outlook', detail: 'Preparing graduates for international careers.' },
]

const faculties = [
  { badge: 'Department of Web Development', title: 'Web Development', detail: 'Building the next generation of web engineers — clean code, performance and modern frameworks.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=700&q=80' },
  { badge: 'Department of Data & AI', title: 'Data & Artificial Intelligence', detail: 'Turning data into decisions through applied statistics, machine learning and analytics.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=80' },
  { badge: 'Department of UI/UX Design', title: 'UI/UX Design', detail: 'Designing meaningful digital products through research, systems thinking and craft.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=700&q=80' },
  { badge: 'Department of Cloud & DevOps', title: 'Cloud & DevOps', detail: 'Reliable infrastructure and delivery pipelines for modern, scalable software.', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=700&q=80' },
  { badge: 'Department of Cyber Security', title: 'Cyber Security', detail: 'Protecting systems and data through applied security practice and ethical hacking.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=700&q=80' },
]

const advantages = [
  { icon: Target, title: 'Industry-Focused Institution', detail: 'Dedicated specifically to technology workforce development — practical skills, current tools.' },
  { icon: Building2, title: 'Modern Academic Environment', detail: 'Purpose-built campus, advanced labs, and digital learning resources.' },
  { icon: UserCheck, title: 'Practical Learning Experience', detail: 'Industry placements, live projects, and hands-on studio work.' },
  { icon: Cpu, title: 'Technology-Enabled Education', detail: 'AI learning assistants, digital assessment and data-driven feedback.' },
  { icon: Globe2, title: 'Global Career Orientation', detail: 'Prepared for local and international technology careers.' },
]

const digitalCards = [
  { icon: Brain, title: 'Artificial Intelligence', detail: 'AI woven through the learning experience — from personalised study paths to project feedback.', color: '#2f6fed' },
  { icon: Cpu, title: 'AI Readiness', detail: 'Understanding intelligent systems and where they are headed next.', color: '#f5ca32' },
  { icon: ScanEye, title: 'Virtual & Augmented Reality', detail: 'Immersive labs for design, engineering and simulation practice.', color: '#1fb6c9' },
  { icon: Boxes, title: 'Digital Twins', detail: 'Modelling real systems to test, learn and iterate safely.', color: '#ef4444' },
  { icon: Database, title: 'Applied Analytics', detail: 'Data-driven decision making across every discipline.', color: '#2f6fed' },
  { icon: Sparkles, title: 'Automation & Robotics', detail: 'Hands-on exposure to the tools reshaping how work gets done.', color: '#1fb6c9' },
]

function LandingPage({ onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownDismissed, setDropdownDismissed] = useState(false)
  const [isNavbarSticky, setIsNavbarSticky] = useState(false)
  const [activeNav, setActiveNav] = useState('')
  const [selectedProgramCategory, setSelectedProgramCategory] = useState('All Programs')
  const [programSearch, setProgramSearch] = useState('')
  const [showAllPrograms, setShowAllPrograms] = useState(false)
  const [applicationOpen, setApplicationOpen] = useState(false)
  const [applicationForm, setApplicationForm] = useState({ name: '', phone: '', email: '', courseId: '', preferredTiming: '', message: '' })
  const [applicationError, setApplicationError] = useState('')
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationSubmitting, setApplicationSubmitting] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactError, setContactError] = useState('')
  const [teamOpportunity, setTeamOpportunity] = useState(null)
  const [teamOpportunityForm, setTeamOpportunityForm] = useState({ name: '', email: '', phone: '', expertise: '', experience: '', interest: '', education: '', department: '', message: '' })
  const [teamOpportunityError, setTeamOpportunityError] = useState('')
  const [teamOpportunitySubmitting, setTeamOpportunitySubmitting] = useState(false)
  const [teamOpportunitySubmitted, setTeamOpportunitySubmitted] = useState(false)
  const teamOpportunityNameRef = useRef(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: `Hi! I'm The Prime help assistant. Ask me about programs, duration, admissions, fees, or class timings.` }])
  const chatMessagesEndRef = useRef(null)
  const [programs, setPrograms] = useState([])
  const [courses, setCourses] = useState([])
  const [showAllFeeCourses, setShowAllFeeCourses] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')
  const [startupLoaderComplete, setStartupLoaderComplete] = useState(() => sessionStorage.getItem('prime_startup_loader_seen') === 'true')
  const [team, setTeam] = useState([])
  const [lifeAtPrime, setLifeAtPrime] = useState(defaultLifeAtPrime)
  const applicationNameRef = useRef(null)
  const [institute, setInstitute] = useState(null)
  const instituteName = institute?.name || 'The Prime Institute of Science & Technology'
  const instituteShortName = institute?.shortName || 'The Prime'
  const instituteEmail = institute?.email || 'info@theprime.edu.pk'
  const institutePhone = institute?.phone || '+92 300 1234567'
  const instituteSecondaryPhone = institute?.secondaryPhone || '03103252548'
  const whatsappNumber = institutePhone.replace(/\D/g, '').replace(/^00/, '').replace(/^0/, '92')
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}` : ''
  const instituteAddress = institute?.address || 'Islamabad, Pakistan'
  const campusMapAddress = 'The Prime Institute of Science & Technology, Mezzanine Floor, Shahbaz Arcade, Main Pakora Chowk, Block-I Phase 1, Qasimabad, Hyderabad, 71000, Pakistan'
  const instituteLogo = institute?.logoUrl ? apiAssetUrl(institute.logoUrl) : '/the-prime-logo.svg'
  const landingStats = institute?.stats || { studentCount: 0, facultyCount: 0, programCount: 0 }
  const statValue = (value) => `${Number(value || 0).toLocaleString('en-US')}+`
  const teamLoop = team.length ? Array.from({ length: Math.max(1, Math.ceil(4 / team.length)) }, () => team).flat() : []
  const courseCategories = [...new Set(courses.map((course) => course.category?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const landingProgramCategories = [...new Set(programs.map((program) => program.category?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const navigationProgramCategories = landingProgramCategories.length ? landingProgramCategories : programCategories
  const categoryPrograms = selectedProgramCategory === 'All Programs'
    ? programs
    : programs.filter((program) => program.category?.trim().toLowerCase() === selectedProgramCategory.toLowerCase())
  const programSearchTerm = programSearch.trim().toLowerCase()
  const baseVisiblePrograms = categoryPrograms.filter((program) =>
    !programSearchTerm || [program.name, program.category, program.description].filter(Boolean).join(' ').toLowerCase().includes(programSearchTerm)
  )
  const visiblePrograms = baseVisiblePrograms.map((program) => {
    const matchingCourse = courses.find((course) =>
      course.slug === program.slug ||
      course.name?.trim().toLowerCase() === program.name?.trim().toLowerCase()
    )
    return { ...program, imageUrl: program.imageUrl || matchingCourse?.imageUrl || null }
  })
  const campusGallery = Array.isArray(lifeAtPrime.gallery) ? lifeAtPrime.gallery.filter((image) => image.src && image.caption) : []
  const footerSocialLinks = [
    { key: 'instagram', label: 'Instagram', href: institute?.instagramUrl || 'https://www.instagram.com/', icon: <Camera size={18} aria-hidden="true" /> },
    { key: 'email', label: 'Email', href: `mailto:${instituteEmail}`, icon: <Mail size={18} aria-hidden="true" /> },
    { key: 'youtube', label: 'YouTube', href: institute?.youtubeUrl || 'https://www.youtube.com/', icon: <MonitorPlay size={18} aria-hidden="true" /> },
    { key: 'facebook', label: 'Facebook', href: institute?.facebookUrl || 'https://www.facebook.com/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13h2.8v8h3.5z" /></svg> },
    { key: 'linkedin', label: 'LinkedIn', href: institute?.linkedinUrl || 'https://www.linkedin.com/', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 3.5a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2ZM3.4 9h3.7v11.5H3.4V9Zm5.9 0h3.5v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.7 0 4.4 2.4 4.4 5.5v6.3H17v-5.6c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9v5.7H9.3V9Z" /></svg> },
  ]
  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  const selectNav = (tab) => { setActiveNav(tab); setMenuOpen(false) }
  const openApplication = (courseId = '') => {
    setApplicationError('')
    setApplicationSubmitted(false)
    setApplicationForm((form) => ({ ...form, courseId }))
    setApplicationOpen(true)
  }
  const openTeamOpportunity = (opportunity) => {
    setTeamOpportunity(opportunity)
    setTeamOpportunityError('')
    setTeamOpportunitySubmitted(false)
    setTeamOpportunityForm({ name: '', email: '', phone: '', expertise: '', experience: '', interest: '', education: '', department: '', message: '' })
  }
  const submitTeamOpportunity = async (event) => {
    event.preventDefault()
    if (!teamOpportunity) return
    setTeamOpportunityError('')
    setTeamOpportunitySubmitting(true)
    const { type, detailFields } = teamOpportunities[teamOpportunity]
    const details = Object.fromEntries([...detailFields.map(({ name }) => [name, teamOpportunityForm[name]]), ['message', teamOpportunityForm.message]])
    const formData = new FormData(event.currentTarget)
    formData.set('applicationType', type)
    formData.set('details', JSON.stringify(details))
    try {
      await apiUpload('/admissions/opportunities/public', formData)
      setTeamOpportunitySubmitted(true)
    } catch (error) {
      setTeamOpportunityError(error.message || 'Could not submit your application. Please try again.')
    } finally {
      setTeamOpportunitySubmitting(false)
    }
  }
  const getChatReply = (question) => {
    const text = question.toLowerCase()
    const course = courses.find((item) => text.includes(item.name.toLowerCase()))
    if (/\b(hi|hello|hey|salam|assalam)\b/.test(text)) return { text: `Hello! How can I help you with ${instituteShortName}? You can ask about programs, duration, admissions, fees, or timings.` }
    if (/\b(fee|fees|price|cost|charges|qist|installment)\b/.test(text)) return { text: `Fees depend on the selected program. Please contact admissions on ${institutePhone} for the latest fee details.`, link: whatsappUrl }
    if (/\b(duration|how long|kitne mahine|months|month)\b/.test(text)) {
      if (course) return { text: `${course.name}${course.durationMonths ? ` runs for ${course.durationMonths} months` : ''}.${course.description?.trim() ? ` ${course.description.trim()}` : ''}` }
      const availableCourses = courses.filter((item) => item.durationMonths)
      return { text: availableCourses.length ? `Program durations: ${availableCourses.map((item) => `${item.name}: ${item.durationMonths} months`).join('; ')}.` : 'Please contact admissions for program duration details.', link: whatsappUrl }
    }
    if (course) return { text: `${course.name}${course.durationMonths ? ` is a ${course.durationMonths}-month program` : ''}.${course.description?.trim() ? ` ${course.description.trim()}` : ''} Ask admissions for current fees and enrollment details.`, action: 'Start an inquiry' }
    if (/\b(program|programs|course|courses|class|classes)\b/.test(text)) {
      return { text: courses.length ? `Our available programs are: ${courses.map((item) => `${item.name}${item.durationMonths ? ` (${item.durationMonths} months)` : ''}`).join(', ')}. Which one would you like to know about?` : 'Please contact admissions to ask about available programs.', link: whatsappUrl }
    }
    if (/\b(apply|admission|admissions|enroll|enrollment|registration)\b/.test(text)) return { text: 'You can submit an admissions inquiry with your contact details and preferred program.', action: 'Open admission form' }
    if (/\b(time|timing|schedule|morning|afternoon|evening)\b/.test(text)) return { text: 'The inquiry form lets you choose Morning, Afternoon, or Evening as your preferred class timing.', action: 'Open admission form' }
    if (/\b(address|location|where|campus)\b/.test(text)) return { text: `Our institute address is ${instituteAddress}.` }
    if (/\b(contact|phone|call|whatsapp|number)\b/.test(text)) return { text: `You can call admissions at ${institutePhone}${whatsappUrl ? ' or message us on WhatsApp.' : '.'}`, link: whatsappUrl }
    return { text: 'I can help with programs, course duration, admissions, fees, class timings, and our address. For anything else, send an inquiry to the admissions team.', action: 'Open admission form' }
  }
  const sendChatMessage = (event) => {
    event.preventDefault()
    const question = chatInput.trim()
    if (!question) return
    const reply = getChatReply(question)
    setChatMessages((messages) => [...messages, { role: 'user', text: question }, { role: 'assistant', ...reply }])
    setChatInput('')
  }
  const closeApplication = () => {
    if (!applicationSubmitting) setApplicationOpen(false)
  }
  const updateApplicationField = (event) => {
    const { name, value } = event.target
    setApplicationForm((form) => ({ ...form, [name]: value }))
    setApplicationError('')
  }
  const submitApplication = async (event) => {
    event.preventDefault()
    setApplicationError('')
    setApplicationSubmitting(true)
    try {
      await apiPost('/admissions/inquiries/public', applicationForm)
      setApplicationSubmitted(true)
      setApplicationForm({ name: '', phone: '', email: '', courseId: '', preferredTiming: '', message: '' })
    } catch (error) {
      setApplicationError(error.message || 'Could not submit your inquiry. Please try again.')
    } finally {
      setApplicationSubmitting(false)
    }
  }
  const submitContactMessage = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const message = Object.fromEntries(formData.entries())
    setContactError('')
    setContactSubmitting(true)
    try {
      await apiPost('/contact/messages/public', message)
      form.reset()
      setContactSubmitted(true)
    } catch (error) {
      setContactError(error.message || 'Could not send your message. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }
  const handleNavClick = (event) => {
    const link = event.target.closest('a')
    if (!link || !event.currentTarget.contains(link)) return
    setMenuOpen(false)
    const dropdownItem = Boolean(link.closest('.landing-dropdown-menu'))
    if (dropdownItem) {
      setDropdownDismissed(true)
      link.blur()
    }
    const category = navigationProgramCategories.find((item) => item === link.textContent.trim())
    if (link.textContent.trim() === 'All Programs' || category) {
      event.preventDefault()
      setSelectedProgramCategory(category || 'All Programs')
      selectNav('academics')
      scrollTo('#programs')
      return
    }
    const dropdown = link.closest('.landing-nav-dropdown')
    if (dropdown) {
      const label = dropdown.querySelector(':scope > a')?.textContent.trim()
      const tab = { 'About us': 'about', Academics: 'academics', 'Our Team': 'faculty', Admissions: 'admissions' }[label]
      if (tab) selectNav(tab)
      return
    }
    const href = link.getAttribute('href')
    if (href === '#top') selectNav('home')
    else if (href === '#campus') selectNav('events')
    else if (href === '#contact' || href === '#location-contact') selectNav('contact')
    else if (href === '#programs') selectNav('academics')
    else if (href === '#faculty') selectNav('faculty')
    else if (href === '#experience' || href === '#vision' || href === '#why-prime') selectNav('about')
  }
  useEffect(() => {
    if (startupLoaderComplete) return undefined
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('prime_startup_loader_seen', 'true')
      setStartupLoaderComplete(true)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [startupLoaderComplete])

  useEffect(() => {
    apiGet('/institutes/public').then(({ data }) => {
      setInstitute({ ...data.institute, stats: data.stats, courses: data.courses })
      setCourses(Array.isArray(data.courses) ? data.courses : [])
      setPrograms(Array.isArray(data.programs) ? data.programs : [])
      setTeam(Array.isArray(data.team) ? data.team : [])
      if (data.lifeAtPrime) setLifeAtPrime({ ...defaultLifeAtPrime, ...data.lifeAtPrime })
    }).catch((error) => {
      setCoursesError(error.message || 'Could not load programs. Please try again later.')
    }).finally(() => setCoursesLoading(false))
  }, [])

  useEffect(() => {
    const updateStickyState = () => setIsNavbarSticky(window.scrollY >= 42)
    updateStickyState()
    window.addEventListener('scroll', updateStickyState, { passive: true })
    return () => window.removeEventListener('scroll', updateStickyState)
  }, [])

  useEffect(() => {
    if (!applicationOpen && !teamOpportunity) return undefined
    if (applicationOpen) applicationNameRef.current?.focus()
    else teamOpportunityNameRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (teamOpportunity && !teamOpportunitySubmitting) setTeamOpportunity(null)
      else if (applicationOpen && !applicationSubmitting) setApplicationOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [applicationOpen, applicationSubmitting, teamOpportunity, teamOpportunitySubmitting])

  useEffect(() => {
    if (chatOpen) chatMessagesEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [chatMessages, chatOpen])

  if (coursesLoading || !startupLoaderComplete) return <LoadingScreen />

  return <div className="landing-page">
    {whatsappUrl && <a className="whatsapp-float" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C8.86 3 3.02 8.78 3.02 15.9c0 2.26.6 4.47 1.73 6.42L3 29l6.88-1.79a13.1 13.1 0 0 0 6.16 1.52h.01c7.18 0 13.02-5.78 13.02-12.9 0-3.45-1.36-6.7-3.83-9.14A13 13 0 0 0 16.04 3Zm0 23.54h-.01c-1.87 0-3.7-.5-5.3-1.44l-.38-.23-4.08 1.06 1.09-3.94-.25-.4a10.64 10.64 0 0 1-1.64-5.69c0-5.84 4.75-10.59 10.58-10.59 2.82 0 5.48 1.1 7.47 3.1a10.5 10.5 0 0 1 3.1 7.49c0 5.84-4.75 10.64-10.58 10.64Zm5.8-7.94c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.59-1.59-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.49-.57.16-.19.22-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.33-1.13 1.1-1.13 2.68s1.16 3.1 1.32 3.31c.16.21 2.28 3.47 5.52 4.86.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.1 1.9-.78 2.16-1.53.27-.76.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" /></svg>
    </a>}
    {chatOpen && <section className="help-chat-panel" role="dialog" aria-label="The Prime help chat">
      <header className="help-chat-header"><span className="help-chat-avatar"><MessageCircle size={19} /></span><span><strong>{instituteShortName} Help</strong><small>Ask about programs and admissions</small></span><button type="button" onClick={() => setChatOpen(false)} aria-label="Close help chat"><X size={18} /></button></header>
      <div className="help-chat-messages" aria-live="polite">
        {chatMessages.map((message, index) => <div className={`help-chat-message ${message.role}`} key={`help-message-${index}`}><p>{message.text}</p>{message.link && <a href={message.link} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}{message.action && <button type="button" onClick={() => { setChatOpen(false); openApplication() }}>{message.action}</button>}</div>)}
        <div ref={chatMessagesEndRef} />
      </div>
      {chatMessages.length === 1 && <div className="help-chat-suggestions">{['Show programs', 'Admission info', 'Fee details'].map((question) => <button key={question} type="button" onClick={() => setChatInput(question)}>{question}</button>)}</div>}
      <form className="help-chat-form" onSubmit={sendChatMessage}><input aria-label="Ask a question" placeholder="Type your question..." value={chatInput} onChange={(event) => setChatInput(event.target.value)} /><button type="submit" aria-label="Send question" disabled={!chatInput.trim()}><Send size={17} /></button></form>
    </section>}
    <button className="help-chat-toggle" type="button" onClick={() => setChatOpen((open) => !open)} aria-label={chatOpen ? 'Close help chat' : 'Open help chat'}>{chatOpen ? <X size={25} /> : <MessageCircle size={25} />}</button>
    <div className="landing-utility"><strong className="landing-welcome">Welcome to {instituteName}</strong><div className="landing-utility-contact"><a className="landing-phone-link" href={`tel:${institutePhone.replace(/[^\d+]/g, '')}`}><Phone size={15} aria-hidden="true" />{institutePhone}</a><a className="landing-phone-link" href={`tel:${instituteSecondaryPhone.replace(/[^\d+]/g, '')}`}><Phone size={15} aria-hidden="true" />{instituteSecondaryPhone}</a><span className="landing-hours"><Clock size={15} aria-hidden="true" />11:00 AM – 10:00 PM</span><button className="landing-utility-apply" onClick={openApplication}>Apply Now</button></div></div>
    <header className={isNavbarSticky ? 'landing-header is-stuck' : 'landing-header'}>
      <a className="landing-brand" href="#top">
        <span className="landing-brand-image-frame"><img src={instituteLogo} alt={`${instituteShortName} logo`} /></span>
        <span className="landing-brand-text"><strong>{instituteShortName}</strong><small>{instituteName}</small></span>
      </a>
      <nav data-active={activeNav} data-dropdown-dismissed={dropdownDismissed} onClick={handleNavClick} onMouseLeave={() => setDropdownDismissed(false)} className={menuOpen ? 'landing-nav is-open' : 'landing-nav'}>
        <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
        <div className="landing-nav-dropdown">
          <a href="#experience" onClick={() => setMenuOpen(false)}>About us <ChevronDown size={13} /></a>
          <div className="landing-dropdown-menu"><a href="#vision" onClick={() => setMenuOpen(false)}>Our Vision</a><a href="#why-prime" onClick={() => setMenuOpen(false)}>Why The Prime</a><a href="#contact" onClick={() => setMenuOpen(false)}>Corporate Training &amp; Development</a></div>
        </div>
        <div className="landing-nav-dropdown">
          <a href="#programs" onClick={() => setMenuOpen(false)}>Academics <ChevronDown size={13} /></a>
          <div className="landing-dropdown-menu">
            <a href="#programs" onClick={() => setMenuOpen(false)}>All Programs</a>
            {navigationProgramCategories.map((category) => <a href="#programs" key={category} onClick={() => setMenuOpen(false)}>{category}</a>)}
          </div>
        </div>
        <div className="landing-nav-dropdown">
          <a href="#faculty" onClick={() => setMenuOpen(false)}>Our Team <ChevronDown size={13} /></a>
          <div className="landing-dropdown-menu">
            <a href="#faculty" onClick={() => setMenuOpen(false)}>Meet our faculty</a>
            <a href="#contact" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); openTeamOpportunity('faculty') }}>Join Our Faculty</a>
            <a href="#contact" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); openTeamOpportunity('community') }}>Join Software House Community</a>
            <a href="#contact" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setMenuOpen(false); openTeamOpportunity('internship') }}>Apply for Internship</a>
          </div>
        </div>
        <div className="landing-nav-dropdown">
          <a href="#admission-process" onClick={() => setMenuOpen(false)}>Admissions <ChevronDown size={13} /></a>
          <div className="landing-dropdown-menu"><a href="#contact" onClick={(event) => { event.preventDefault(); setMenuOpen(false); openApplication() }}>Apply for Admission</a><a href="#admission-process" onClick={() => setMenuOpen(false)}>Admission Process</a><a href="#admission-fees" onClick={() => setMenuOpen(false)}>Fee Structure</a><a href="#admission-scholarships" onClick={() => setMenuOpen(false)}>Scholarships &amp; Discounts</a><a href="#admission-faqs" onClick={() => setMenuOpen(false)}>Frequently Asked Questions (FAQs)</a></div>
        </div>
        <a href="#campus" onClick={() => setMenuOpen(false)}>Events</a>
        <a href="#location-contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <div className="landing-header-actions"><button className="landing-apply-button" onClick={onLogin}>Login</button></div>
      <button className="landing-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </header>
    <main id="top">
      <section className="landing-hero"><div className="landing-hero-copy"><span className="landing-eyebrow">{instituteName}</span><h1>Developing the digital professionals <em>the world needs.</em></h1><p>A future-ready institute integrating education, practical technology, innovation, and emerging skills for a changing world.</p><div className="landing-hero-actions"><button className="landing-primary-button" onClick={() => scrollTo('#programs')}>Explore programs <ArrowRight size={17} /></button><button className="landing-play-button" onClick={() => scrollTo('#experience')}><span><Play size={13} fill="currentColor" /></span> Why The Prime</button></div><div className="landing-trust-line"><span><CheckCircle2 size={14} /> Learning by doing</span><span><CheckCircle2 size={14} /> Industry-ready skills</span></div></div></section>

      <section className="landing-marquee"><span>Digital learning</span><i /> <span>Career-ready skills</span><i /> <span>Mentor-led growth</span><i /> <span>International Level confidence</span></section>

      <section className="landing-stats-strip">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <article><GraduationCap size={25} /><strong>{statValue(landingStats.studentCount)}</strong><span>Students</span></article><article><Users size={25} /><strong>{statValue(landingStats.facultyCount)}</strong><span>Faculty members</span></article><article><ShieldCheck size={25} /><strong>{statValue(landingStats.programCount)}</strong><span>Programs</span></article><article><CalendarDays size={25} /><strong>{statValue(institute?.yearsOfExcellence ?? 5)}</strong><span>Years of excellence</span></article>
      </section>

      <section className="landing-purple-band"><span className="landing-eyebrow">Global tech workforce challenge</span><h2>Preparing talent for an industry <em>under transformation.</em></h2><p>Technology is entering a new era. Across the world, employers are experiencing increasing demand for skilled digital professionals due to:</p><div className="landing-pill-row">{challengeTags.map(({ icon: Icon, label }) => <span key={label}><Icon size={11} style={{ marginRight: 5, verticalAlign: -2 }} />{label}</span>)}</div><p style={{ marginTop: 30, fontWeight: 700, fontSize: 15, color: '#fff' }}>&ldquo;Develop skilled tech professionals who can contribute nationally and internationally.&rdquo;</p><p style={{ fontSize: 10, opacity: .7 }}>— The Prime mission, aligned with this global need</p></section>

      <section className="landing-process">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="landing-section-heading"><span className="landing-eyebrow">The Prime global response</span><h2>From classroom to <em>real-world impact.</em></h2><p>The Prime follows a four-stage workforce development model.</p></div><div className="process-row">{processSteps.map((step, index) => <Fragment key={step.title}>
        <article className="process-step"><span className="process-step-badge">{step.number}</span><div className="process-step-icon"><step.icon size={20} /></div><h3>{step.title}</h3><p>{step.detail}</p></article>
        {index < processSteps.length - 1 && <ArrowRight className="process-arrow" size={20} />}
      </Fragment>)}</div></section>

      <section className="landing-section landing-programs" id="programs">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="landing-section-heading">
          <div>
            <span className="landing-eyebrow">Find your direction</span>
            <h2>{selectedProgramCategory === 'All Programs' ? <>Programs built around <em>doing.</em></> : <>{selectedProgramCategory}</>}</h2>
          </div>
        </div>
        {programs.length > 0 && (
          <div className="landing-programs-toolbar" role="search" aria-label="Search and filter programs">
            <label className="landing-programs-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={programSearch}
                onChange={(event) => { setProgramSearch(event.target.value); setShowAllPrograms(false) }}
                placeholder="Search programs, skills, or keywords"
                aria-label="Search programs"
              />
              {programSearch && (
                <button type="button" onClick={() => setProgramSearch('')} aria-label="Clear program search">
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="landing-programs-filter">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <select
                value={selectedProgramCategory}
                onChange={(event) => { setSelectedProgramCategory(event.target.value); setShowAllPrograms(false) }}
                aria-label="Filter programs by category"
              >
                <option>All Programs</option>
                {landingProgramCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            {(programSearch || selectedProgramCategory !== 'All Programs') && (
              <button
                className="landing-programs-reset"
                type="button"
                onClick={() => { setProgramSearch(''); setSelectedProgramCategory('All Programs'); setShowAllPrograms(false) }}
              >
                Reset
              </button>
            )}
            <span className="landing-programs-results" aria-live="polite">
              {visiblePrograms.length} {visiblePrograms.length === 1 ? 'program' : 'programs'}
            </span>
          </div>
        )}
        {coursesError && <p className="landing-courses-status" role="alert">{coursesError}</p>}
        {visiblePrograms.length ? <><div className="program-grid program-specialty-grid">{(selectedProgramCategory === 'All Programs' && !programSearchTerm && !showAllPrograms ? visiblePrograms.slice(0, 8) : visiblePrograms).map((program) => <article
          className="specialty-card program-specialty-card"
          key={program.id}
          style={{ backgroundImage: program.imageUrl ? `url("${apiAssetUrl(program.imageUrl)}")` : 'linear-gradient(135deg, #30356f, #747bb1)' }}
        >
          <span className="specialty-badge">{program.category || 'Program'}{program.durationMonths ? ` · ${program.durationMonths} months` : ''}</span>
          <h3>{program.name}</h3>
          <p>{program.description?.trim() || 'Explore this program and contact our admissions team to learn more.'}</p>
        </article>)}</div>{selectedProgramCategory === 'All Programs' && !programSearchTerm && visiblePrograms.length > 8 && <button className="landing-programs-toggle" type="button" aria-expanded={showAllPrograms} onClick={() => setShowAllPrograms((current) => !current)}>{showAllPrograms ? 'See less programs' : 'View all programs'} <ChevronDown size={15} /></button>}</> : <div className="landing-programs-empty"><Search size={20} /><p>{programSearchTerm || selectedProgramCategory !== 'All Programs' ? 'No programs match your search or selected filter.' : coursesError || 'No programs are listed in this category yet. Please contact admissions for details.'}</p>{(programSearchTerm || selectedProgramCategory !== 'All Programs') && <button type="button" onClick={() => { setProgramSearch(''); setSelectedProgramCategory('All Programs') }}>Clear filters</button>}</div>}
      </section>

      <section className="landing-impact" id="experience">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="landing-impact-copy"><span className="landing-eyebrow">About The Prime</span><h2>A centre for applied education, innovation &amp; <em>professional excellence.</em></h2><p>A multidisciplinary technology institute strengthening the digital workforce through quality education, professional training and innovation.</p><div className="landing-impact-list">{aboutPoints.map(({ icon: Icon, title, detail }) => <span key={title}><Icon size={14} /> <strong style={{ color: '#45257a' }}>{title}</strong> — {detail}</span>)}</div><button className="landing-primary-button">Learn more about The Prime <ArrowRight size={15} /></button></div><div className="landing-impact-image"><img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=900&q=80" alt="Modern institute building" /></div>
      </section>

      <section className="landing-vision" id="vision"><div className="landing-vision-inner"><span className="landing-eyebrow">Our vision — vision 2035</span><blockquote>&ldquo;To become a globally recognized technology education and innovation ecosystem producing future-ready digital professionals who transform industries through knowledge, technology and creativity.&rdquo;</blockquote><cite><b>Institutional philosophy:</b> Human-centred technology, powered by knowledge &amp; innovation.</cite></div></section>

      <section className="landing-team" id="faculty">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="landing-team-heading">
          <span className="landing-eyebrow">Meet our people</span>
          <h2>Introducing our <em>talented team.</em></h2>
          <p>Meet our exceptional team of professional specialists shaping a dynamic future through talent and dedication.</p>
        </div>
        {team.length ? (
          <div className="landing-team-viewport">
            <div className="landing-team-track">
              {[0, 1].map((loop) => (
                <div className="landing-team-slide" key={`team-loop-${loop}`} aria-hidden={loop === 1}>
                  {teamLoop.map((member, index) => (
                    <article className="team-member-card" key={`${loop}-${index}-${member.id}`} aria-hidden={loop === 1}>
                      <div className="team-member-photo">
                        {member.avatarUrl
                          ? <img src={apiAssetUrl(member.avatarUrl)} alt={loop === 0 ? `${member.firstName} ${member.lastName}` : ''} loading="lazy" />
                          : <span aria-hidden="true">{`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`}</span>}
                      </div>
                      <div className="team-member-info">
                        <h3>{member.firstName} {member.lastName}</h3>
                        <p>{member.skills || member.qualifications || 'Faculty member'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="landing-courses-status">No active team members are available right now.</p>
        )}
      </section>

      <section className="landing-advantage" id="why-prime">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <span className="landing-eyebrow">Why The Prime</span><h2>The future-ready <em>learning advantage.</em></h2><div className="advantage-grid">{advantages.map(({ icon: Icon, title, detail }) => <article key={title}><div className="advantage-icon"><Icon size={16} /></div><h3>{title}</h3><p>{detail}</p></article>)}</div>
      </section>

      <section className="landing-digital" id="outcomes"><span className="landing-eyebrow">Digital transformation &amp; AI strategy</span><h2>Preparing tech professionals for the intelligent digital era.</h2><p>Technology is rapidly transforming through artificial intelligence and emerging tools — the Prime Digital Innovation Initiative builds that future in.</p><div className="digital-grid">{digitalCards.map(({ icon: Icon, title, detail, color }) => <article className="digital-card" key={title}><div className="digital-card-icon" style={{ background: color }}><Icon size={18} /></div><h3>{title}</h3><p>{detail}</p></article>)}</div></section>

      <section className="campus-experience" id="campus">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="campus-heading"><span className="landing-eyebrow">{lifeAtPrime.eyebrow}</span><h2>{lifeAtPrime.titlePrefix} <em>{lifeAtPrime.titleHighlight}</em></h2><p>{lifeAtPrime.description}</p></div><div className="campus-pillars">{(Array.isArray(lifeAtPrime.categories) ? lifeAtPrime.categories : defaultLifeAtPrime.categories).filter((category) => category?.trim()).map((category, index) => { const Icon = campusCategoryIcons[index % campusCategoryIcons.length]; return <span key={`${category}-${index}`}><Icon size={15} /> {category}</span> })}</div>{campusGallery.length > 0 && <div className="campus-gallery">{campusGallery.map((item) => <figure key={item.src}><img src={item.src.startsWith('/uploads/') ? apiAssetUrl(item.src) : item.src} alt={item.alt} loading="lazy" /><figcaption>{item.caption}</figcaption></figure>)}</div>}
      </section>

      <section className="landing-admissions" id="admissions">
        <LoginParticleBackground className="landing-section-particle-background" particleColor="#30356f" glowColor="#f7991c" />
        <div className="landing-section-heading admissions-heading">
          <div><span className="landing-eyebrow">Admissions</span><h2>Your next step starts <em>here.</em></h2><p>Explore the process, review published course fees, or ask our team for guidance.</p></div>
          <button className="landing-primary-button" onClick={openApplication}>Apply for admission <ArrowRight size={17} /></button>
        </div>
        <div className="admission-process" id="admission-process">
          <div className="admission-subheading"><ClipboardCheck size={19} /><div><h3>Admission process</h3><p>Four simple steps to get started.</p></div></div>
          <div className="admission-step-grid">{admissionSteps.map(({ icon: Icon, title, detail }, index) => <article className="admission-step" key={title}><span className="admission-step-number">{String(index + 1).padStart(2, '0')}</span><Icon size={20} /><h4>{title}</h4><p>{detail}</p></article>)}</div>
        </div>
        <div className="admission-fees admission-fees-panel" id="admission-fees">
          <div className="admission-subheading"><WalletCards size={19} /><div><h3>Course Fee Structure</h3><p>Fees shown here are loaded from the active course records.</p></div></div>
          {courses.length ? <><div className="admission-fee-grid">{(showAllFeeCourses ? courses : courses.slice(0, 6)).map((course) => {
            const monthlyFee = Number(course.monthlyFeeMinor || 0) / 100
            const totalFee = Number(course.totalFeeMinor || 0) / 100
            return <article className="admission-fee-card" key={course.id}>
              <div className="admission-fee-card-meta">
                <span className="admission-fee-category">{course.category || 'Course'}</span>
                <span className="admission-fee-duration"><Clock size={13} />{course.durationMonths ? `${course.durationMonths} months` : 'Duration varies'}</span>
              </div>
              <h4>{course.name}</h4>
              {totalFee > 0 || monthlyFee > 0 ? (
                <div className="admission-fee-pricing">
                  {totalFee > 0 && <div className="admission-fee-price"><small>Full program fee</small><strong>Rs {totalFee.toLocaleString('en-PK')}</strong></div>}
                  {monthlyFee > 0 && <div className="admission-fee-price admission-fee-monthly"><small>Monthly installment</small><strong>Rs {monthlyFee.toLocaleString('en-PK')}</strong></div>}
                </div>
              ) : (
                <div className="admission-fee-undisclosed"><strong>Fee details</strong><span>Contact admissions for current fees.</span></div>
              )}
              <button type="button" onClick={() => openApplication(course.id)}>Apply for this course <ArrowRight size={14} /></button>
            </article>
          })}</div>{courses.length > 6 && <button className="admission-fee-toggle" type="button" aria-expanded={showAllFeeCourses} onClick={() => setShowAllFeeCourses((current) => !current)}>{showAllFeeCourses ? 'See less' : 'See more'} <ChevronDown size={15} /></button>}</> : <p className="admission-empty">Course fees will appear here when active courses are available. Contact admissions for details.</p>}
        </div>
        <div className="admission-scholarships" id="admission-scholarships">
          <div className="admission-scholarship-copy"><BadgePercent size={21} /><div><h3>Scholarships &amp; discounts</h3><p>Ask the admissions team about current scholarship or discount availability and eligibility.</p></div></div>
          <button type="button" onClick={openApplication}>Ask admissions <ArrowRight size={15} /></button>
        </div>
        <div className="admission-faqs" id="admission-faqs">
          <div className="admission-subheading"><CircleHelp size={19} /><div><h3>Frequently asked questions</h3><p>Quick answers to common admission questions.</p></div></div>
          <div className="admission-faq-list">{admissionFaqs.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={16} /></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>
      <section className="landing-cta" id="contact"><div><span className="landing-eyebrow">Your next move</span><h2>Ready to make it <em>real?</em></h2><p>Talk to our admissions team and find the right program for your goals.</p></div><button className="landing-primary-button" onClick={openApplication}>Start your application <ArrowRight size={17} /></button></section>
      <section className="location-contact-section" id="location-contact" aria-labelledby="location-contact-title">
        <LoginParticleBackground className="location-contact-particle-background" particleColor="#30356f" glowColor="#f7991c" spacing={32} interactionRadius={150} />
        <h2 id="location-contact-title">Location &amp; <span>Contact</span></h2>
        <div className="location-contact-card">
          <div className="location-map">
            <iframe
              title={`${instituteName} location on Google Maps`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(campusMapAddress)}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campusMapAddress)}`} target="_blank" rel="noreferrer">
              <MapPin size={14} /> {campusMapAddress} <span>View map <ArrowRight size={13} /></span>
            </a>
          </div>
          <div className="location-contact-panel">
            <div className="location-contact-socials">
              <h3>Connect</h3>
              <div>{footerSocialLinks.map(({ key, label, href, icon }) => <a key={key} href={href} target={key === 'email' ? undefined : '_blank'} rel={key === 'email' ? undefined : 'noreferrer'} aria-label={label}>{icon}</a>)}</div>
            </div>
            {contactSubmitted
              ? <div className="location-contact-success" role="status"><CheckCircle2 size={22} /><p>Thank you! Your message has been sent to our team.</p><button type="button" onClick={() => setContactSubmitted(false)}>Send another message</button></div>
              : <form className="location-contact-form" onSubmit={submitContactMessage}>
                <h3>Send a message</h3>
                <label>
                  <span className="sr-only">Your name</span>
                  <input type="text" name="name" placeholder="Name" autoComplete="name" maxLength={160} required />
                </label>
                <label>
                  <span className="sr-only">Your email</span>
                  <input type="email" name="email" placeholder="Email" autoComplete="email" maxLength={254} required />
                </label>
                <label>
                  <span className="sr-only">Subject</span>
                  <input type="text" name="subject" placeholder="Subject" maxLength={160} required />
                </label>
                <label>
                  <span className="sr-only">Message</span>
                  <textarea name="message" placeholder="Message" rows={4} maxLength={2000} required />
                </label>
                {contactError && <p className="location-contact-error" role="alert">{contactError}</p>}
                <button type="submit" disabled={contactSubmitting}>{contactSubmitting ? 'Sending...' : 'Send'} {!contactSubmitting && <Send size={14} />}</button>
                <p>Our team will get back to you as soon as possible.</p>
              </form>}
            <div className="location-contact-details">
              <a href={`mailto:${instituteEmail}`}><Mail size={15} />{instituteEmail}</a>
              <a href={`tel:${institutePhone.replace(/[^\d+]/g, '')}`}><Phone size={15} />{institutePhone}</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="footer-brand">
          <div className="landing-brand"><img src={instituteLogo} alt="Institute logo" /></div>
          <p>Excellence in technology education and training. Shaping the future of digital talent in Pakistan.</p>
          <div className="footer-socials">{footerSocialLinks.map(({ key, label, href, icon }) => <a key={key} href={href} target={key === 'email' ? undefined : '_blank'} rel={key === 'email' ? undefined : 'noreferrer'} aria-label={label}>{icon}</a>)}</div>
        </div>
        <div className="footer-col">
          <h4>Quick links</h4>
          <ul><li><a href="#experience">About us</a></li><li><a href="#programs">Programs</a></li><li><a href="#contact">Admissions</a></li><li><a href="#faculty">Faculty</a></li><li><a href="#outcomes">News &amp; events</a></li><li><a href="#contact">Contact</a></li></ul>
        </div>
        <div className="footer-col">
          <h4>Our Courses</h4>
          <ul>{faculties.map((f) => <li key={f.title}><a href="#faculty">{f.title}</a></li>)}</ul>
        </div>
        <div className="footer-col">
          <h4>Contact info</h4>
          <ul className="footer-contact">
            <li><MapPin size={13} /> {instituteAddress}</li>
            <li><Phone size={13} /> {institutePhone}</li>
            <li><Mail size={13} /> {instituteEmail}</li>
            {institute?.academicYear && <li><CalendarDays size={13} /> Academic year: {institute.academicYear}</li>}
          </ul>
        </div>
        <button
          className="footer-scroll-top"
          type="button"
          aria-label="Scroll to top"
          title="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={20} strokeWidth={2.4} />
        </button>
      </div>
      <div className="landing-footer-bottom">© 2026 {instituteName}. All rights reserved.</div>
    </footer>
    {teamOpportunity && <div className="application-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !teamOpportunitySubmitting) setTeamOpportunity(null) }}>
      <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="team-opportunity-title">
        <button className="application-modal-close" type="button" onClick={() => setTeamOpportunity(null)} aria-label="Close application form" disabled={teamOpportunitySubmitting}><X size={20} /></button>
        <span className="landing-eyebrow">Our Team · Application</span>
        <h2 id="team-opportunity-title">{teamOpportunities[teamOpportunity].title}</h2>
        <p className="application-modal-description">{teamOpportunities[teamOpportunity].description}</p>
        {teamOpportunitySubmitted
          ? <div className="application-success" role="status"><CheckCircle2 size={22} /><p>Your application has been received. Our team will contact you soon.</p><button className="landing-primary-button" type="button" onClick={() => setTeamOpportunity(null)}>Done</button></div>
          : <form className="application-form team-opportunity-form" onSubmit={submitTeamOpportunity}>
            <label><span className="application-label-title">Full name <b>*</b></span><input ref={teamOpportunityNameRef} name="name" autoComplete="name" maxLength={160} required value={teamOpportunityForm.name} onChange={(event) => setTeamOpportunityForm((form) => ({ ...form, name: event.target.value }))} /></label>
            <label><span className="application-label-title">Email address <b>*</b></span><input name="email" type="email" autoComplete="email" maxLength={254} required value={teamOpportunityForm.email} onChange={(event) => setTeamOpportunityForm((form) => ({ ...form, email: event.target.value }))} /></label>
            <label><span className="application-label-title">Mobile / WhatsApp number <b>*</b></span><input name="phone" type="tel" autoComplete="tel" maxLength={40} required value={teamOpportunityForm.phone} onChange={(event) => setTeamOpportunityForm((form) => ({ ...form, phone: event.target.value }))} /></label>
            {teamOpportunities[teamOpportunity].detailFields.map(({ name, label, required }) => <label key={name}><span className="application-label-title">{label} {required && <b>*</b>}</span><input name={name} maxLength={500} required={required} value={teamOpportunityForm[name]} onChange={(event) => setTeamOpportunityForm((form) => ({ ...form, [name]: event.target.value }))} /></label>)}
            <label className="team-cv-field"><span className="application-label-title">Upload CV <b>*</b></span><input name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required /></label>
            <label className="application-message-field"><span className="application-label-title">Additional message <small>(Optional)</small></span><textarea name="message" rows={3} maxLength={2000} value={teamOpportunityForm.message} onChange={(event) => setTeamOpportunityForm((form) => ({ ...form, message: event.target.value }))} /></label>
            {teamOpportunityError && <p className="application-form-error" role="alert">{teamOpportunityError}</p>}
            <button className="application-submit-button" type="submit" disabled={teamOpportunitySubmitting}>{teamOpportunitySubmitting ? 'Submitting...' : 'Submit application'}</button>
          </form>}
      </section>
    </div>}
    {applicationOpen && <div className="application-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeApplication() }}>
      <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
        <button className="application-modal-close" type="button" onClick={closeApplication} aria-label="Close application form" disabled={applicationSubmitting}><X size={20} /></button>
        <span className="landing-eyebrow">Admissions inquiry</span>
        <h2 id="application-modal-title">Apply for Admission</h2>
        <p className="application-modal-description">Share your details and our admissions team will get in touch.</p>
        {applicationSubmitted ? <div className="application-success" role="status"><CheckCircle2 size={22} /><p>Your inquiry has been submitted. Our team will contact you soon.</p><button className="landing-primary-button" type="button" onClick={closeApplication}>Done</button></div> : <form className="application-form" onSubmit={submitApplication}>
          <label><span className="application-label-title">Full Name <b>*</b></span><input ref={applicationNameRef} name="name" type="text" autoComplete="name" maxLength={160} required value={applicationForm.name} onChange={updateApplicationField} /></label>
          <label><span className="application-label-title">Mobile / WhatsApp Number <b>*</b></span><input name="phone" type="tel" autoComplete="tel" maxLength={40} required value={applicationForm.phone} onChange={updateApplicationField} /></label>
          <label><span className="application-label-title">Email Address <small>(Optional)</small></span><input name="email" type="email" autoComplete="email" maxLength={254} value={applicationForm.email} onChange={updateApplicationField} /></label>
          <label><span className="application-label-title">Select Program / Course <b>*</b></span><select name="courseId" required disabled={!courses.length} value={applicationForm.courseId} onChange={updateApplicationField}><option value="">{coursesLoading ? 'Loading courses...' : courses.length ? 'Choose a program or course' : 'No active courses available'}</option>{courseCategories.map((category) => <optgroup label={category} key={category}>{courses.filter((course) => course.category === category).map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</optgroup>)}</select></label>
          <label><span className="application-label-title">Preferred Class Timing <b>*</b></span><select name="preferredTiming" required value={applicationForm.preferredTiming} onChange={updateApplicationField}><option value="">Select preferred timing</option><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="EVENING">Evening</option></select></label>
          <label className="application-message-field"><span className="application-label-title">Your Message <small>(Optional)</small></span><textarea name="message" rows={3} maxLength={2000} value={applicationForm.message} onChange={updateApplicationField} /></label>
          {applicationError && <p className="application-form-error" role="alert">{applicationError}</p>}
          <button className="application-submit-button" type="submit" disabled={applicationSubmitting}>{applicationSubmitting ? 'Submitting...' : 'Submit Inquiry'}</button>
        </form>}
      </section>
    </div>}
  </div>
}

export default LandingPage
