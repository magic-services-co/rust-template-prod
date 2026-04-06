"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TeamMember {
  userId: string;
  name?: string;
  image?: string;
  role?: string;
  roleColor?: string;
}

interface TeamProps {
  members?: TeamMember[];
}

export default function Team({ members }: TeamProps) {
  const [activeTab, setActiveTab] = useState(0);

  const membersPerTab = 9;
  const tabsCount = useMemo(() => {
    return members && members.length > 0 ? Math.ceil(members.length / membersPerTab) : 0;
  }, [members]);
  
  const currentTabMembers = useMemo(() => {
    if (!members || members.length === 0) return [];
    const start = activeTab * membersPerTab;
    return members.slice(start, start + membersPerTab);
  }, [members, activeTab]);

  useEffect(() => {
    if (activeTab >= tabsCount && tabsCount > 0) {
      setActiveTab(Math.max(0, tabsCount - 1));
    }
  }, [tabsCount, activeTab]);

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {tabsCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Select value={activeTab.toString()} onValueChange={(v) => setActiveTab(Number(v))}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: tabsCount }).map((_, index) => (
                <SelectItem key={index} value={index.toString()}>
                  Tab {index + 1} (Members {index * membersPerTab + 1}-{Math.min((index + 1) * membersPerTab, members.length)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {currentTabMembers.map((member, index) => (
          <div key={member.userId || index} className="flex flex-col items-center space-y-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name || 'Team member'}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border-2 object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full border-2 bg-muted flex items-center justify-center">
                <span className="text-2xl text-muted-foreground">?</span>
              </div>
            )}
            <p className="text-center text-sm font-medium truncate w-full">
              {member.name || 'Unknown'}
            </p>
            {member.role && (
              <p 
                className="text-center text-xs truncate w-full"
                style={{ 
                  color: member.roleColor && /^#[0-9A-F]{6}$/i.test(member.roleColor) 
                    ? member.roleColor 
                    : undefined 
                }}
              >
                {member.role}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
