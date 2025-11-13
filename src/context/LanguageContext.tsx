// src/context/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: Record<Language, Record<string, string>> = {
  mr: {
    // Navigation
    dashboard: 'डॅशबोर्ड',
    villages: 'गावे',
    aarakhada: 'आराखडा जोडा',
    funds: 'वितरित केलेला फंड',
    workProgress: 'कामाची प्रगती',
    tracking: 'ट्रॅकिंग',

    // Villages
    villageManagement: 'गाव व्यवस्थापन',
    addVillage: 'नवीन गाव जोडा',
    editVillage: 'गाव संपादित करा',
    deleteVillage: 'गाव हटवा',
    villageName: 'गावाचे नाव',
    block: 'तालुका ',
    gramPanchayat: 'ग्राम पंचायत',
    district: 'जिल्हा',
    actions: 'क्रिया',
    save: 'जतन करा',
    cancel: 'रद्द करा',
    edit: 'संपादित करा',
    delete: 'हटवा',
    search: 'शोधा',
    viewWork: 'काम पहा',
    viewVillage: 'गाव पहा',
    workCreatedSuccessfully: 'काम यशस्वीरित्या तयार केले',

    // Common
    loading: 'लोड होत आहे...',
    error: 'त्रुटी',
    success: 'यशस्वी',
    total: 'एकूण',
    filter: 'फिल्टर',
    export: 'निर्यात',
    refresh: 'रिफ्रेश',

    // Aarakhada - shared
    taluka: 'तालुका',
    financial: 'आर्थिक',
    physical: 'भौतिक',
    workCategory: 'कामाचा प्रकार',
    workName: 'कामाचे नाव',
    selectVillage: 'गाव निवडा',
    selectCategory: 'प्रकार निवडा',
    status: 'स्थिती',
    startDate: 'सुरुवातीची तारीख',
    completionDate: 'पूर्ण होण्याची तारीख',
    addWork: 'नवीन काम जोडा',
    editWork: 'काम संपादित करा',

    // Financial table
    srNo: 'अनुक्रमांक',
    pesaVillageName: 'पेसा गावाचे नाव',
    pesaVillageCount: 'पेसा गावांची संख्या',
    annualApprovedFund: 'वार्षिक मंजूर निधी (रु.)',
    annualReceivedFund: 'वार्षिक प्राप्त निधी (रु.)',
    receivedInterest: 'प्राप्त व्याजाची रक्कम',
    totalReceivedFund: 'एकूण प्राप्त निधी (रु.)',
    previousExpenditure: 'मागील महिन्या पर्यंतचा एकूण खर्च (रु.)',
    currentExpenditure: 'चालू महिन्यातील एकूण खर्च (रु.)',
    cumulativeExpenditure: 'एकुण प्रगती पथावरील खर्च (रु.)',
    remainingFunds: 'एकूण शिल्लक निधी (रु.)',
    sanctionedAmount: 'मंजूर निधी (रु.)',
    releasedAmount: 'प्राप्त निधी (रु.)',
    previousMonthExpenditure: 'मागील महिन्यातील खर्च (रु)',
    currentMonthExpenditure: 'चालू महिन्यातील खर्च (रु)',
    selectMonth: 'महिना निवडा',
    month: 'महिना',
    currentMonth:'चालू महिना',

    // Physical table
    approvedWorks: 'चालू मंजूर कामांची संख्या',
    sanctionedWorks: 'मंजुर कामे',
    completedWorks: 'पुर्ण झालेली कामे',
    ongoingWorks: 'प्रगती पथावरील कामे',
    pendingWorks: 'अद्याप सुरु न झालेली कामे',
    talukaName: 'तालुक्याचे नाव',
    pesaGramPanchayatCount: 'पेसा ग्रा.पं. संख्या',
    pesaGrampanchayat : 'पेसा ग्राम पंचायत',

    // New fields for Villages table
    ceoZp: 'जिल्हा परिषद',
    bdoPs: 'पंचायत समिति',
    gsk: 'ग्रामपंचायत',
    gskPopulation: 'ग्रामपंचायत लोकसंख्या',
    gskStPopulation: 'ग्रामपंचायत अनु.जमाती लोकसंख्या',
    villagePopulation: 'गावाची लोकसंख्या',
    villageSTPopulation: 'गावाची अनु.जमाती लोकसंख्या',
    amountPerHeadSTPopulation: 'प्रति व्यक्ती अनु.जमाती लोकसंख्या रक्कम',
    fundAllocatedVillageWise: 'गावनिहाय वितरित निधी',
    fundAllocatedGpWise: 'ग्रा.पं.निहाय वितरित निधी',


    workManagement: 'कार्य व्यवस्थापन',
    addNewWork: 'नवीन कार्य जोडा',
    serial_no: 'अनुक्रमांक',
    workFlowTaluka: 'तालुका',
    year: 'वर्ष',
    work_name: 'कामाचे नाव',
    department: 'विभाग',
    approval_amount : 'मंजुरी रक्कम',
    admin_approval_no: 'प्रशासकीय मंजुरी क्रमांक',
    admin_approval_date: 'प्रशासकीय मंजुरी दिनांक',
    admin_approval_amount: 'प्रशासकीय मंजुरी रक्कम',
    tech_approval_no: 'तांत्रिक मंजुरी क्रमांक',
    tech_approval_date: 'तांत्रिक मंजुरी दिनांक',
    tech_approval_amount: 'तांत्रिक मंजुरी रक्कम',
    agreement_approval_no: 'कार्य आरंभ आदेश क्रमांक',
    agreement_approval_date: 'कार्य आरंभ आदेश दिनांक',
    agreement_approval_amount: 'प्राप्त निधी',
    duration: 'निविदा कालावधी',
    contractor_name: 'कंत्राटदाराचे नाव',
    current_status: 'सध्याची स्थिती',
    delay: 'उशीर',
    expected_completion_date: 'अपेक्षित पूर्णता दिनांक',
    note: 'नोंद',
    priority: "प्राधान्य",
    selectOption: "पर्याय निवडा",
    low: "कमी",
    medium: "मध्यम",
    high: "जास्त",
    pending: "प्रलंबित",
    in_progress: "सुरू आहे",
    completed: "पूर्ण",
    completion: 'पूर्णत्व',
    activeStages: 'सद्यस्थिती टप्पे',
    days: "दिवस",
    inProgress: "प्रगतीमध्ये",
    cardPending: "प्रलंबित",
    // Add any other missing keys similarly...
    workTitle: 'कार्याचे शीर्षक',
    description: 'वर्णन',
    assignedTo: 'नियुक्त केले',
    role: 'भूमिका',
    workFlowStatus: 'स्थिती',
    workFlowPriority: 'प्राधान्य',
    dueDate: 'अंतिम तारीख',
    workFlowActions: 'क्रिया',
    admin: 'प्रशासक',
    clerk: 'लिपिक',
    officer: 'अधिकारी',
    developer: 'विकासक',
    
    // Workflow related
    workflowBuilder: 'वर्कफ्लो बिल्डर',
    workflowProgress: 'वर्कफ्लो प्रगती',
    selectWork: 'काम निवडा',
    buildWorkflow: 'वर्कफ्लो तयार करा',
    addStep: 'पायरी जोडा',
    stepTitle: 'पायरीचे शीर्षक',
    stepDuration: 'पायरीचा कालावधी (दिवस)',
    activateWorkflow: 'वर्कफ्लो सक्रिय करा',
    workflowActivated: 'वर्कफ्लो सक्रिय केले गेले!',
    close: 'बंद करा',
    update: 'संपादित करा',
    
    // Common
    All: 'सर्व',
    'Filter by Status': 'स्थितीनुसार फिल्टर करा',
    'Filter by Priority': 'प्राधान्यानुसार फिल्टर करा',
    'No works found': 'कोणतीही कामे सापडली नाहीत',
    'Sr. No': 'अनुक्रमांक',
    gram_panchayat_work_id: 'ग्राम पंचायत कामाचा संदर्भ',
    village_id: 'गावाचा संदर्भ',

    workDashboard: 'काम डॅशबोर्ड',
    manageAndTrackAllWorkAssignments: 'सर्व कामांचे व्यवस्थापन आणि ट्रॅक करा',
    overallProgress: 'एकूण प्रगती',
    village: 'गाव',
    selectGramPanchayatPhysicalWork: 'ग्रा.पं. भौतिक काम निवडा',
    selectPesaVillageWorkAndBuildWorkflow: 'पेसा गाव काम निवडा आणि सानुकूल टप्प्यांसह वर्कफ्लो तयार करा',
    selectWorkToStartBuildingWorkflow: 'वर्कफ्लो तयार करण्यासाठी काम निवडा',
    selectPesaVillageWorkWorkflowToTrackProgressAndManageSteps: 'प्रगती ट्रॅक करण्यासाठी आणि टप्पे व्यवस्थापित करण्यासाठी पेसा गाव काम वर्कफ्लो निवडा',
    
    // Authentication
    signIn: 'प्रवेश करा',
    signOut: 'बाहेर पडा',
    email: 'ईमेल',
    password: 'पासवर्ड',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    loginError: 'लॉगिन करताना त्रुटी',
    invalidCredentials: 'चुकीचे ईमेल किंवा पासवर्ड',
    fillAllFields: 'कृपया सर्व फील्ड भरा',
    loggingIn: 'प्रवेश करत आहे...',
    loggedIn: 'लॉग इन केले आहे',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    villages: 'Villages',
    aarakhada: 'Aarakhada',
    funds: 'Distributed Funds',
    workProgress: 'Work Tracking',
    tracking: 'Tracking',

    // Villages
    villageManagement: 'Village Management',
    addVillage: 'Add New Village',
    editVillage: 'Edit Village',
    deleteVillage: 'Delete Village',
    villageName: 'Village Name',
    block: 'Block',
    gramPanchayat: 'Gram Panchayat',
    district: 'District',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    viewWork: 'View Work',
    viewVillage: 'View Village',
     workCreatedSuccessfully: 'Work Created Successfully',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    total: 'Total',
    filter: 'Filter',
    export: 'Export',
    refresh: 'Refresh',

    // Aarakhada - shared
    taluka: 'Taluka',
    financial: 'Financial',
    physical: 'Physical',
    workCategory: 'Work Category',
    workName: 'Work Name',
    selectVillage: 'Select Village',
    selectCategory: 'Select Category',
    selectWork: 'Select Work',
    status: 'Status',
    startDate: 'Start Date',
    completionDate: 'Completion Date',
    addWork: 'Add New Work',
    editWork: 'Edit Work',

    // Financial table
    srNo: 'Sr. No.',
    pesaVillageName: 'PESA Village Name',
    pesaVillageCount: 'No. of PESA Villages',
    annualApprovedFund: 'Annual Approved Fund (₹)',
    annualReceivedFund: 'Annual Received Fund (₹)',
    receivedInterest: 'Received Interest (₹)',
    totalReceivedFund: 'Total Received Fund (₹)',
    previousExpenditure: 'Total Expenditure Till Last Month (₹)',
    currentExpenditure: 'Current Month Expenditure (₹)',
    cumulativeExpenditure: 'Cumulative Expenditure (₹)',
    remainingFunds: 'Remaining Funds (₹)',
    sanctionedAmount: 'Sanctioned Amount',
    releasedAmount: 'Released Amount',
    previousMonthExpenditure: 'Previous Month Expenditure',
    currentMonthExpenditure: 'Current Month Expenditure',
    selectMonth: 'Select Month',
    month: 'Month',
    currentMonth:'Current Month',


    // Physical table
    approvedWorks: 'Current Approved Works',
    sanctionedWorks: 'Sanctioned Works',
    completedWorks: 'Completed Works',
    ongoingWorks: 'Ongoing Works',
    pendingWorks: 'Pending Works',
    talukaName: 'Taluka Name',
    pesaGramPanchayatCount: 'PESA Gram Panchayat Count',
    pesaGrampanchayat : 'PESA GramPanchayat',

    // New fields for Villages table
    ceoZp: 'Zilla Parishad',
    bdoPs: 'Panchayat Samiti',
    gsk: 'Gram Panchayat',
    gskPopulation: 'GP Population',
    gskStPopulation: 'GP ST Population',
    villagePopulation: 'Village Population',
    villageSTPopulation: 'Village ST Population',
    amountPerHeadSTPopulation: 'Amount per Head ST Population',
    fundAllocatedVillageWise: 'Fund Allocated Village Wise',
    fundAllocatedGpWise: 'Fund Allocated GP Wise',

    workManagement: 'Work Management',
    addNewWork: 'Add New Work',
    serial_no: 'Serial No',
    workFlowTaluka: 'Taluka',
    year: 'Year (format:2024-25)',
    work_name: 'Work Name',
    department: 'Department',
    approval_amount : 'Approval Amount',
    admin_approval_no: 'Admin Approval No',
    admin_approval_date: 'Admin Approval Date',
    admin_approval_amount: 'Admin Approval Amount',
    tech_approval_no: 'Tech Approval No',
    tech_approval_date: 'Tech Approval Date',
    tech_approval_amount: 'Tech Approval Amount',
    agreement_approval_no: 'Work Commencement Order No',
    agreement_approval_date: 'Work Commencement Order Date',
    agreement_approval_amount: 'Released Amount',
    duration: 'Tender Period',
    contractor_name: 'Contractor Name',
    current_status: 'Current Status',
    delay: 'Delay',
    expected_completion_date: 'Expected Completion Date',
    note: 'Note',
    priority: "Priority",
    selectOption: "Select an option",
    low: "Low",
    medium: "Medium",
    high: "High",
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    completion: 'Completion',
    activeStages: 'Active Stages',
    days: "days",
    inProgress: "In Progress",
    cardPending: "Pending",
    // Add any other missing keys similarly...
    workTitle: 'Work Title',
    description: 'Description',
    assignedTo: 'Assigned To',
    role: 'Role',
    workFlowStatus: 'Status',
    workFlowPriority: 'Priority',
    dueDate: 'Due Date',
    workFlowActions: 'Actions',
    admin: 'Admin',
    clerk: 'Clerk',
    officer: 'Officer',
    developer: 'Developer',
    
    // Workflow related
    workflowBuilder: 'Workflow Builder',
    workflowProgress: 'Workflow Progress',
    buildWorkflow: 'Build Workflow',
    addStep: 'Add Step',
    stepTitle: 'Step Title',
    stepDuration: 'Step Duration (days)',
    activateWorkflow: 'Activate Workflow',
    workflowActivated: 'Workflow activated successfully!',
    close: 'Close',
    update: 'Update',
    
    // Common
    All: 'All',
    'Filter by Status': 'Filter by Status',
    'Filter by Priority': 'Filter by Priority',
    'No works found': 'No works found',
    'Sr. No': 'Sr. No',
    gram_panchayat_work_id: 'Gram Panchayat Work Reference',
    village_id: 'Village Reference',

    workDashboard: 'Work Dashboard',
    manageAndTrackAllWorkAssignments: 'Manage and track all work assignments',
    overallProgress: 'Overall Progress',
    village: 'Village',
    selectGramPanchayatPhysicalWork: 'Select Gram Panchayat Physical Work',
    selectPesaVillageWorkAndBuildWorkflow: 'Select PESA village work and build workflow with custom steps',
    selectWorkToStartBuildingWorkflow: 'Select a work to start building workflow',
    selectPesaVillageWorkWorkflowToTrackProgressAndManageSteps: 'Select a PESA village work workflow to track progress and manage steps',

    // Authentication
    signIn: 'Sign In',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    loginError: 'Login Error',
    invalidCredentials: 'Invalid email or password',
    fillAllFields: 'Please fill in all fields',
    loggingIn: 'Signing in...',
    loggedIn: 'Logged in',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'mr';
  });

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};