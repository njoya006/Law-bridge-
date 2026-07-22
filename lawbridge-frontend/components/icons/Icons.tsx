import React from 'react'
import {
  LayoutDashboard, Upload, FileBarChart, MessageSquare, FileText, Folder, CreditCard,
  Settings, Search, Sun, Moon, User, LogOut, ChevronLeft, ChevronRight, Bell, Grip,
  ArrowRight, Check, Scale, Briefcase, Calendar, Landmark, BarChart3, Users, Inbox,
  Send, Sparkles, Shield, ChevronUp, ChevronDown, BookOpen, Printer, MapPin, Compass,
  Building2, Clipboard, Bookmark, BadgeCheck, SlidersVertical, Pencil, BarChart2, Star,
  AlertTriangle, XCircle, CheckCircle2, Users2, Eye, EyeOff, Network, Activity,
  Handshake, CornerUpRight, Trophy, Gavel, TrendingUp, UserPlus, Award, Plus, Clock, Mail,
  type LucideIcon,
} from 'lucide-react'

interface IconProps {
  className?: string
  width?: number
  height?: number
}

/**
 * Thin adapter: every icon in this file used to be a hand-rolled inline SVG with the
 * signature { className, width, height }. This wraps lucide-react icons behind the
 * exact same signature so no call site in the app needs to change.
 */
function wrap(Lucide: LucideIcon, defaultW = 20, defaultH = 20, defaultClass = 'w-5 h-5') {
  return function WrappedIcon({ className = defaultClass, width = defaultW, height = defaultH }: IconProps) {
    return <Lucide width={width} height={height} className={className} strokeWidth={1.75} />
  }
}

export const DashboardIcon     = wrap(LayoutDashboard)
export const UploadIcon        = wrap(Upload)
export const AnalysisIcon      = wrap(FileBarChart)
export const ChatIcon          = wrap(MessageSquare)
export const DocumentIcon      = wrap(FileText)
export const CaseIcon          = wrap(Folder)
export const PaymentIcon       = wrap(CreditCard)
export const SettingsIcon      = wrap(Settings)
export const SearchIcon        = wrap(Search)
export const SunIcon           = wrap(Sun)
export const MoonIcon          = wrap(Moon)
export const UserIcon          = wrap(User)
export const LogoutIcon        = wrap(LogOut)
export const CollapseIcon      = wrap(ChevronLeft)
export const ExpandIcon        = wrap(ChevronRight)
export const BellIcon          = wrap(Bell)
export const GridIcon          = wrap(Grip)
export const ArrowRightIcon    = wrap(ArrowRight)
export const CheckIcon         = wrap(Check, 20, 20, 'w-5 h-5')
export const BalanceIcon       = wrap(Scale)
export const BriefcaseIcon     = wrap(Briefcase)
export const CalendarIcon      = wrap(Calendar)
export const LawIcon           = wrap(Landmark)
export const ChartBarIcon      = wrap(BarChart3)
export const UsersIcon         = wrap(Users)
export const InboxIcon         = wrap(Inbox)
export const SendIcon          = wrap(Send)
export const SparklesIcon      = wrap(Sparkles)
export const ShieldIcon        = wrap(Shield)
export const ChevronUpIcon     = wrap(ChevronUp, 16, 16, 'w-4 h-4')
export const ChevronDownIcon   = wrap(ChevronDown, 16, 16, 'w-4 h-4')
export const BookOpenIcon      = wrap(BookOpen)
export const PrinterIcon       = wrap(Printer)
export const MapPinIcon        = wrap(MapPin)
export const CompassIcon       = wrap(Compass)
export const BuildingIcon      = wrap(Building2)
export const ClipboardIcon     = wrap(Clipboard)
export const BookmarkIcon      = wrap(Bookmark)
export const BadgeCheckIcon    = wrap(BadgeCheck)
export const SlidersIcon       = wrap(SlidersVertical)
export const PencilIcon        = wrap(Pencil)
export const BarChart2Icon     = wrap(BarChart2)
export const StarIcon          = wrap(Star)
export const AlertTriangleIcon = wrap(AlertTriangle)
export const XCircleIcon       = wrap(XCircle)
export const CheckCircleIcon   = wrap(CheckCircle2)
export const TeamIcon          = wrap(Users2)
export const EyeIcon           = wrap(Eye, 16, 16, 'w-4 h-4')
export const EyeOffIcon        = wrap(EyeOff, 16, 16, 'w-4 h-4')
export const NetworkIcon       = wrap(Network)
export const ActivityIcon      = wrap(Activity)
export const HandshakeIcon     = wrap(Handshake)
export const ReferralIcon      = wrap(CornerUpRight)
export const TrophyIcon        = wrap(Trophy)
export const GavelIcon         = wrap(Gavel)
export const TrendingUpIcon    = wrap(TrendingUp)
export const UserPlusIcon      = wrap(UserPlus)
export const BriefcaseStarIcon = wrap(Award)
export const PlusIcon           = wrap(Plus)
export const ClockIcon          = wrap(Clock)
export const MailIcon           = wrap(Mail)
