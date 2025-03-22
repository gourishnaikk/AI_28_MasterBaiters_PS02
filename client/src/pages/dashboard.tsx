import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TypographyH1, TypographyH3, TypographyP, TypographyH4 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, User, MessageSquare, LogOut, HelpCircle, 
  BarChart3, Send, AlertCircle, Bot, ChevronDown, 
  ChevronUp, ExternalLink, Clock
} from "lucide-react";

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  role: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  lastUpdated: Date;
}

interface AnalyticsData {
  revenueGrowth: number;
  customerSatisfaction: number;
  productivityRate: number;
  pendingTickets: number;
  resolvedTickets: number;
  projectCompletion: number;
}

export default function DashboardPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");
  const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [apiKey, setApiKey] = useState<string>("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");
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Fetch employee data
    const fetchEmployeeData = async () => {
      try {
        const response = await fetch('/api/employee/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        }
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
    loadDemoData();
  }, []);

  // Load demo data for the dashboard
  const loadDemoData = () => {
    // Initial welcome message
    setMessages([
      {
        id: '1',
        sender: 'ai',
        content: 'Hello! I am Sentinel AI, your intelligent assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);

    // Sample FAQs
    setFaqs([
      {
        id: '1',
        question: 'How do I reset my password?',
        answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions sent to your registered email address.',
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        id: '2',
        question: 'What is the company policy on remote work?',
        answer: 'IDMS Infotech offers a hybrid work model. Employees can work remotely up to 3 days per week, with in-office attendance required for team meetings and collaborative sessions.',
        lastUpdated: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
      },
      {
        id: '3',
        question: 'How do I submit an expense report?',
        answer: 'Expense reports should be submitted through the ERP portal under "Finance > Expenses". All receipts must be attached, and reports should be submitted within 30 days of incurring the expense.',
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: '4',
        question: 'When is the next company-wide meeting?',
        answer: 'The next company-wide meeting is scheduled for the last Friday of this month at 3:00 PM. The agenda and meeting link will be shared via email a week in advance.',
        lastUpdated: new Date()
      },
      {
        id: '5',
        question: 'How do I access the development servers?',
        answer: 'Development server access requires VPN connection and proper authorization. Submit an access request through the IT portal, and once approved, you will receive credentials and connection instructions.',
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ]);

    // Sample analytics data
    setAnalytics({
      revenueGrowth: 12.5,
      customerSatisfaction: 85,
      productivityRate: 92,
      pendingTickets: 14,
      resolvedTickets: 47,
      projectCompletion: 78
    });
  };
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local storage and reload page
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSendingMessage(true);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      let aiResponse: ChatMessage;
      
      // Simple pattern matching for demo purposes
      if (inputMessage.toLowerCase().includes('hello') || inputMessage.toLowerCase().includes('hi')) {
        aiResponse = {
          id: Date.now().toString(),
          sender: 'ai',
          content: `Hello there! How can I assist you today?`,
          timestamp: new Date()
        };
      } else if (inputMessage.toLowerCase().includes('password')) {
        aiResponse = {
          id: Date.now().toString(),
          sender: 'ai',
          content: `To reset your password, please visit the login page and click on "Forgot Password". You'll receive instructions via email to complete the process. Need anything else?`,
          timestamp: new Date()
        };
      } else if (inputMessage.toLowerCase().includes('leave') || inputMessage.toLowerCase().includes('vacation')) {
        aiResponse = {
          id: Date.now().toString(),
          sender: 'ai',
          content: `To apply for leave, please go to the HR Portal > Leave Management > Apply Leave. Make sure to submit your request at least 7 days in advance for proper planning. Is there anything specific about the leave policy you'd like to know?`,
          timestamp: new Date()
        };
      } else if (inputMessage.toLowerCase().includes('project') || inputMessage.toLowerCase().includes('deadline')) {
        aiResponse = {
          id: Date.now().toString(),
          sender: 'ai',
          content: `I can see that you have 3 active projects with upcoming deadlines. The nearest one is Project Alpha, due in 5 days. Would you like me to show you the full project timeline or help you prioritize your tasks?`,
          timestamp: new Date()
        };
      } else {
        aiResponse = {
          id: Date.now().toString(),
          sender: 'ai',
          content: `Thank you for your query. I'll need to analyze this further. Would you like me to escalate this to support for a more detailed response?`,
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsSendingMessage(false);
    }, 1500);
  };

  const handleEscalateToSupport = () => {
    toast({
      title: "Query escalated",
      description: "Your query has been escalated to L1 support. A team member will contact you shortly.",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    // Scroll to bottom of messages when new ones are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleApiKeyEdit = () => {
    setIsEditingApiKey(!isEditingApiKey);
  };

  const saveApiKey = () => {
    setIsEditingApiKey(false);
    toast({
      title: "API Key Updated",
      description: "Your Sentinel AI API key has been updated successfully.",
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-accent mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <TypographyP className="text-muted-foreground">Loading your dashboard...</TypographyP>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 md:min-h-screen p-4 bg-secondary">
          <div className="flex items-center mb-8">
            <svg className="h-10 w-10 text-accent mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-semibold">IDMS Infotech</h1>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-white">
                {employee?.name?.[0] || 'E'}
              </div>
              <div>
                <p className="font-medium">{employee?.name || 'Employee'}</p>
                <p className="text-xs text-muted-foreground">{employee?.role || 'User'}</p>
              </div>
            </div>
          </div>
          
          <nav className="space-y-1">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveSidebarItem("dashboard");
              }}
              className={`flex items-center px-3 py-2 rounded-md font-medium text-sm transition ${
                activeSidebarItem === "dashboard" 
                  ? "bg-accent text-white" 
                  : "hover:bg-background hover:bg-opacity-10"
              }`}
            >
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </a>
            
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveSidebarItem("chat");
                setActiveTab("chat");
              }}
              className={`flex items-center px-3 py-2 rounded-md font-medium text-sm transition ${
                activeSidebarItem === "chat" 
                  ? "bg-accent text-white" 
                  : "hover:bg-background hover:bg-opacity-10"
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Sentinel AI Chat
            </a>
            
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveSidebarItem("faqs");
                setActiveTab("faqs");
              }}
              className={`flex items-center px-3 py-2 rounded-md font-medium text-sm transition ${
                activeSidebarItem === "faqs" 
                  ? "bg-accent text-white" 
                  : "hover:bg-background hover:bg-opacity-10"
              }`}
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              FAQs
            </a>
            
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setActiveSidebarItem("analytics");
                setActiveTab("analytics");
              }}
              className={`flex items-center px-3 py-2 rounded-md font-medium text-sm transition ${
                activeSidebarItem === "analytics" 
                  ? "bg-accent text-white" 
                  : "hover:bg-background hover:bg-opacity-10"
              }`}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </a>
            
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }} 
              className="flex items-center px-3 py-2 rounded-md font-medium text-sm transition hover:bg-background hover:bg-opacity-10"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </a>
          </nav>
          
          <div className="mt-8 md:mt-auto pt-6">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <div className="text-xs text-muted-foreground">v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          {activeSidebarItem === "dashboard" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-1">Welcome back, {employee?.name || 'Employee'}</h2>
                <p className="text-muted-foreground">Your IDMS Infotech Employee Portal</p>
              </div>
              
              <Tabs defaultValue="chat" className="w-full mb-6">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="chat" onClick={() => {
                    setActiveSidebarItem("chat");
                    setActiveTab("chat");
                  }}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>Sentinel AI</span>
                  </TabsTrigger>
                  <TabsTrigger value="faqs" onClick={() => {
                    setActiveSidebarItem("faqs");
                    setActiveTab("faqs");
                  }}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>FAQs</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" onClick={() => {
                    setActiveSidebarItem("analytics");
                    setActiveTab("analytics");
                  }}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span>Analytics</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">Tasks Due</p>
                        <h3 className="text-2xl font-semibold mt-1">5</h3>
                      </div>
                      <div className="p-2 rounded-md bg-accent text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">Messages</p>
                        <h3 className="text-2xl font-semibold mt-1">3</h3>
                      </div>
                      <div className="p-2 rounded-md bg-accent text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">Next Meeting</p>
                        <h3 className="text-2xl font-semibold mt-1">2:30 PM</h3>
                      </div>
                      <div className="p-2 rounded-md bg-accent text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Activities</CardTitle>
                  </CardHeader>
                  <div>
                    <div className="px-4 py-3 border-t border-border border-opacity-10 flex items-center">
                      <div className="mr-4 p-2 rounded-full bg-accent text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Completed Project Report</p>
                        <p className="text-sm text-muted-foreground">Today, 10:30 AM</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-border border-opacity-10 flex items-center">
                      <div className="mr-4 p-2 rounded-full bg-accent text-white">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">New message from Team Lead</p>
                        <p className="text-sm text-muted-foreground">Yesterday, 4:15 PM</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-border border-opacity-10 flex items-center">
                      <div className="mr-4 p-2 rounded-full bg-accent text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Meeting scheduled with client</p>
                        <p className="text-sm text-muted-foreground">Yesterday, 2:00 PM</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Project Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Website Redesign</span>
                          <span>85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Mobile App Development</span>
                          <span>62%</span>
                        </div>
                        <Progress value={62} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>CRM Integration</span>
                          <span>40%</span>
                        </div>
                        <Progress value={40} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          
          {activeSidebarItem !== "dashboard" && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>Sentinel AI Chat</span>
                </TabsTrigger>
                <TabsTrigger value="faqs" className="flex items-center">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  <span>FAQs</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span>Analytics</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Sentinel AI Chat Tab */}
              <TabsContent value="chat">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bot className="h-5 w-5 mr-2 text-accent" />
                      <span>Sentinel AI Assistant</span>
                    </CardTitle>
                    <CardDescription>
                      Ask Sentinel AI about company policies, procedures, or project information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <label htmlFor="apiKey" className="text-sm font-medium mb-1">API Key</label>
                        <Button variant="ghost" size="sm" onClick={toggleApiKeyEdit} className="h-6 px-2 text-xs">
                          {isEditingApiKey ? 'Cancel' : 'Edit'}
                        </Button>
                      </div>
                      {isEditingApiKey ? (
                        <div className="flex space-x-2">
                          <Input 
                            id="apiKey"
                            type="text" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Sentinel AI API key"
                            className="flex-grow"
                          />
                          <Button size="sm" onClick={saveApiKey}>Save</Button>
                        </div>
                      ) : (
                        <div className="bg-muted/30 p-2 rounded text-sm font-mono truncate">
                          {apiKey.substring(0, 8)}************************
                        </div>
                      )}
                    </div>

                    <div className="border rounded-lg h-96 flex flex-col">
                      <ScrollArea className="flex-grow p-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div 
                              key={msg.id} 
                              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.sender === 'user' 
                                    ? 'bg-accent text-accent-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{msg.content}</p>
                                <div className="text-xs opacity-70 mt-1 text-right">
                                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          ))}
                          {isSendingMessage && (
                            <div className="flex justify-start">
                              <div className="bg-muted max-w-[80%] rounded-lg p-3">
                                <div className="flex space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce"></div>
                                  <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                  <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      
                      <div className="p-3 border-t">
                        <div className="flex space-x-2">
                          <Textarea 
                            placeholder="Type your message..." 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="resize-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button onClick={handleSendMessage} className="self-end">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleEscalateToSupport}
                            className="text-xs h-7 px-2"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Escalate to Support
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Shift + Enter for new line
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* FAQs Tab */}
              <TabsContent value="faqs">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Our knowledge base is automatically updated to ensure information is always current
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            <div className="flex-grow">{faq.question}</div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <p>{faq.answer}</p>
                              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                                <span>Last Updated: {formatDate(faq.lastUpdated)}</span>
                                <Badge variant="outline" className="text-xs">Auto-Updated</Badge>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <TypographyP className="text-sm text-muted-foreground">
                      Can't find what you're looking for?
                    </TypographyP>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("chat")}>
                      Ask Sentinel AI <MessageSquare className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics Overview</CardTitle>
                    <CardDescription>
                      Real-time data from integrated ERP modules and company performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* KPI Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-accent">
                              {analytics?.revenueGrowth}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Revenue Growth</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-accent">
                              {analytics?.customerSatisfaction}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Customer Satisfaction</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-accent">
                              {analytics?.productivityRate}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Team Productivity</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Project Progress */}
                    <div>
                      <TypographyH4 className="mb-4">Current Project Completion</TypographyH4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span className="font-medium">{analytics?.projectCompletion}%</span>
                        </div>
                        <Progress value={analytics?.projectCompletion} className="h-2" />
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Design Phase</span>
                          <span className="font-medium">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Development Phase</span>
                          <span className="font-medium">85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Testing Phase</span>
                          <span className="font-medium">55%</span>
                        </div>
                        <Progress value={55} className="h-2" />
                      </div>
                      
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Deployment Phase</span>
                          <span className="font-medium">20%</span>
                        </div>
                        <Progress value={20} className="h-2" />
                      </div>
                    </div>
                    
                    {/* Support Ticket Metrics */}
                    <div>
                      <TypographyH4 className="mb-4">Support Ticket Overview</TypographyH4>
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Pending Tickets</span>
                              <Badge className="ml-2 bg-amber-500">{analytics?.pendingTickets}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Tickets awaiting response</p>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Resolved This Week</span>
                              <Badge className="ml-2 bg-emerald-500">{analytics?.resolvedTickets}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Successfully resolved tickets</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-3">
                          <div 
                            className="bg-muted p-3 rounded-lg cursor-pointer hover:bg-muted/80"
                            onClick={() => setExpandedTicket(expandedTicket === 'ticket1' ? null : 'ticket1')}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge className="bg-amber-500 mr-2">Priority</Badge>
                                <span className="font-medium">Database Connection Issue</span>
                              </div>
                              {expandedTicket === 'ticket1' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            
                            {expandedTicket === 'ticket1' && (
                              <div className="mt-3 text-sm">
                                <p>Users reporting intermittent connection issues to the production database. Initial investigation suggests network latency problems.</p>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                  <span>Assigned to: Network Team</span>
                                  <span>Opened: 2 days ago</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className="bg-muted p-3 rounded-lg cursor-pointer hover:bg-muted/80"
                            onClick={() => setExpandedTicket(expandedTicket === 'ticket2' ? null : 'ticket2')}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <Badge className="bg-blue-500 mr-2">In Progress</Badge>
                                <span className="font-medium">API Integration Request</span>
                              </div>
                              {expandedTicket === 'ticket2' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                            
                            {expandedTicket === 'ticket2' && (
                              <div className="mt-3 text-sm">
                                <p>Request to integrate with new payment gateway API. Documentation reviewed and implementation plan drafted. Awaiting security review.</p>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                  <span>Assigned to: Development Team</span>
                                  <span>Opened: 5 days ago</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href="#" className="flex items-center justify-center">
                        <span>View Detailed Reports</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
