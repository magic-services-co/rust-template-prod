'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCookieConsent, type CookieConsent } from '@/hooks/use-cookie-consent';
import { Settings, X, Check, Shield, BarChart3, Target, Cookie } from 'lucide-react';

export function CookieConsentBanner() {
  const { isLoaded, needsConsent, acceptAll, denyAll, acceptCustom } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [customConsent, setCustomConsent] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!isLoaded || !needsConsent) {
    return null;
  }

  const handleCustomAccept = () => {
    acceptCustom(customConsent);
    setShowDetails(false);
  };

  const cookieCategories = [
    {
      key: 'necessary' as const,
      title: 'Necessary Cookies',
      description: 'These cookies are essential for the website to function properly. They cannot be disabled.',
      icon: Shield,
      required: true,
    },
    {
      key: 'analytics' as const,
      title: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      icon: BarChart3,
      required: false,
    },
    {
      key: 'marketing' as const,
      title: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements.',
      icon: Target,
      required: false,
    },
    {
      key: 'preferences' as const,
      title: 'Preference Cookies',
      description: 'These cookies allow the website to remember choices you make and provide enhanced, more personal features.',
      icon: Settings,
      required: false,
    },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 shadow-lg">
        <div className="container mx-auto p-4">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Cookie className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Cookie Preferences</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                    By clicking &ldquo;Accept All&rdquo;, you consent to our use of cookies.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Customize
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Button variant="outline" size="sm" onClick={denyAll}>
                    <X className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                  
                  <Button size="sm" onClick={acceptAll}>
                    <Check className="h-4 w-4 mr-2" />
                    Accept All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can change these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {cookieCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.key} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{category.title}</h4>
                          {category.required && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    
                    <Switch
                      checked={customConsent[category.key]}
                      onCheckedChange={(checked) => 
                        setCustomConsent(prev => ({ ...prev, [category.key]: checked }))
                      }
                      disabled={category.required}
                    />
                  </div>
                  {category.key !== 'preferences' && <Separator />}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowDetails(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCustomAccept} className="flex-1">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 