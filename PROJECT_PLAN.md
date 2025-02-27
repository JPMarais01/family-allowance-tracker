# Family Allowance Tracker - Project Plan

## Project Overview

The Family Allowance Tracker is a web application designed to help parents track their children's behavior and helpfulness on a daily basis. Parents can rate each child's performance on a scale of 1-5 daily, mark vacation days with default scores, and generate monthly summaries for allowance calculations. The application follows a custom budget cycle (25th of one month to the 24th of the next) and provides separate interfaces for parents and children.

The application aims to:

- Replace manual tracking systems with a digital solution
- Create transparency in how allowances are calculated
- Foster motivation for children to help around the house
- Provide an easy-to-use interface accessible from any device
- Maintain a history of performance over time

## Features

### Core Features

1. **User Authentication**

   - Secure login for parents with admin privileges
   - Simple login for children with limited view access
   - Password protection for family data

2. **Daily Scoring System**

   - 1-5 rating scale for each child
   - Optional notes field for context
   - Visual indicators of scoring trends

3. **Vacation Day Management**

   - Mark days as "vacation" with a default score (3)
   - Bulk selection for longer vacation periods
   - Visual differentiation of vacation days in the calendar

4. **Custom Budget Cycle**

   - Monthly periods from 25th to 24th of next month
   - Automatic calculation of monthly averages
   - Summary generation for allowance determination

5. **Dashboards**

- Parent dashboard with scoring controls
- Child dashboard showing personal progress
- Visual representations of performance trends

### Additional Features (Future Development)

1. **Achievement System**

   - Badges for consistent good scores
   - Milestone recognition

2. **Notification System**

   - Daily reminders to input scores
   - End-of-cycle summary alerts

## Technology Stack

### Frontend

- **React.js** - Core UI framework
- **Chakra UI** - Component library for responsive design
- **React Router** - Navigation management
- **React Query** - Data fetching and state management
- **Recharts** - Data visualization
- **date-fns** - Date manipulation

### Backend

- **Supabase** - Authentication and database
  - Auth module for user management
  - PostgreSQL database for data storage
  - Row-level security for data protection

### Deployment

- **GitHub** - Code repository
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Static site hosting

## Project Structure

```text
family-allowance-tracker/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Layout.jsx
│   │   ├── scoring/
│   │   │   ├── DailyScoreCard.jsx
│   │   │   ├── ScoreCalendar.jsx
│   │   │   └── VacationDaySelector.jsx
│   │   ├── dashboard/
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── ChildDashboard.jsx
│   │   │   └── ScoreChart.jsx
│   │   └── summary/
│   │       ├── MonthlySummary.jsx
│   │       └── AllowanceCalculator.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── FamilyContext.jsx
│   ├── hooks/
│   │   ├── useScores.js
│   │   ├── useFamily.js
│   │   └── useBudgetCycle.js
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── dateUtils.js
│   │   └── scoreUtils.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── ParentHome.jsx
│   │   ├── ChildHome.jsx
│   │   ├── Settings.jsx
│   │   └── Reports.jsx
│   ├── App.jsx
│   ├── index.jsx
│   └── theme.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
├── README.md
└── supabase/
    └── schema.sql
```

## Implementation Steps

### Phase 1: Project Setup and Foundation

1. **Initialize React Application** - COMPLETED

- Title: Set up React application with Vite
- Description: Create a new React application using Vite for fast development and modern tooling.

```bash
npm create vite@latest family-allowance-tracker -- --template react
cd family-allowance-tracker
npm install
```

2. **Install Core Dependencies** - COMPLETED

- Title: Add essential packages and dependencies
- Description: Install all required packages for UI, routing, state management, and data visualization.

```bash
npm install react-router-dom @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm install @supabase/supabase-js react-query date-fns recharts
```

3. **Setup Supabase Integration**

- Title: Configure Supabase client and authentication
- Description: Create Supabase project, set up authentication, and integrate with React application.

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

4. **Create Database Schema**

- Title: Design and implement database schema in Supabase
- Description: Create tables for users, children, scores, and settings.

```sql
-- supabase/schema.sql
-- Users table (managed by Supabase Auth)

-- Families table
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Family members table
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  base_allowance NUMERIC(10,2) DEFAULT 0, -- Only relevant for children
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily scores table
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  date DATE NOT NULL,
  is_vacation BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Family settings table
CREATE TABLE family_settings (
    family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
    budget_cycle_start_day INTEGER NOT NULL DEFAULT 25,
    vacation_default_score INTEGER DEFAULT 3 CHECK (vacation_default_score >= 1 AND vacation_default_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row level security policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;

-- Policies for families
CREATE POLICY "Families are viewable by owners"
    ON families FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Families are insertable by authenticated users"
    ON families FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Families are updatable by owners"
    ON families FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Family members viewable by family members"
    ON family_members FOR SELECT
    USING (
        family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Daily scores viewable by family based on role"
    ON daily_scores FOR SELECT
    USING (
        -- Parents can see all scores for their family
        EXISTS (
        SELECT 1 FROM family_members fm
        WHERE fm.user_id = auth.uid()
        AND fm.role = 'parent'
        AND fm.family_id = (
            SELECT family_id FROM family_members WHERE id = member_id
        )
        )
        OR
        -- Children can only see their own scores
        member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid() AND role = 'child'
        )
    );

-- Add similar policies for all tables
```

5. **Set Up GitHub Actions for Deployment**

- Title: Configure CI/CD pipeline with GitHub Actions
- Description: Create a workflow to automatically build and deploy to GitHub Pages.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
    push:
    branches:
        - main

jobs:
    build-and-deploy:
    runs-on: ubuntu-latest

    steps:
        - name: Checkout
        uses: actions/checkout@v3

        - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
            node-version: 18

        - name: Install Dependencies
        run: npm ci

        - name: Build
        run: npm run build
        env:
            VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
            VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

        - name: Deploy
        uses: JamesIves/github-pages-deploy-action@v4
        with:
            folder: dist
```

### Phase 2: Authentication and Core Functionality

6. **Implement Authentication System**

- Title: Create login and authentication components
- Description: Build login forms and authentication context for the application.

```jsx
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [familyMember, setFamilyMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch the user's role from family_members
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
          setFamilyMember(data);
        }
      }

      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch the user's role when auth state changes
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
          setFamilyMember(data);
        }
      } else {
        setUserRole(null);
        setFamilyMember(null);
      }

      setLoading(false);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const value = {
    signUp: data => supabase.auth.signUp(data),
    signIn: data => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    userRole,
    familyMember,
    isParent: userRole === 'parent',
    isChild: userRole === 'child',
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
```

7. **Create Family Management**

- Title: Implement family setup and child management
- Description: Build components for creating and managing a family and adding children.

```jsx
// src/hooks/useFamily.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useFamily() {
  const queryClient = useQueryClient();
  const { user, userRole, familyMember } = useAuth();

  const getFamily = async () => {
    // If we already have the family member data with family_id
    if (familyMember) {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyMember.family_id)
        .single();

      if (error) throw error;
      return data;
    }

    return null;
  };

  const getFamilyMembers = async () => {
    if (!familyMember) return [];

    let query = supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('name');

    // For parent users, get all family members
    // For child users, only get themselves
    if (userRole === 'child') {
      query = query.eq('id', familyMember.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  };

  const addFamilyMember = async memberData => {
    // First create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: memberData.email,
      password: memberData.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Then create family_member record with role
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        user_id: authData.user.id,
        family_id: memberData.family_id,
        name: memberData.name,
        role: memberData.role,
        base_allowance: memberData.base_allowance || 0,
      })
      .select();

    if (error) throw error;
    return data;
  };

  // Queries and mutations
  const family = useQuery('family', getFamily);
  const familyMembers = useQuery('familyMembers', getFamilyMembers);

  const addMemberMutation = useMutation(addFamilyMember, {
    onSuccess: () => {
      queryClient.invalidateQueries('familyMembers');
    },
  });

  return {
    family: family.data,
    isLoadingFamily: family.isLoading,
    familyMembers: familyMembers.data || [],
    isLoadingFamilyMembers: familyMembers.isLoading,
    children: familyMembers.data?.filter(m => m.role === 'child') || [],
    parents: familyMembers.data?.filter(m => m.role === 'parent') || [],
    addFamilyMember: addMemberMutation.mutate,
    isAddingMember: addMemberMutation.isLoading,
    currentMember: familyMember,
  };
}
```

8. **Create Scoring System**

- Title: Develop daily scoring interface and data structure
- Description: Build components for entering and viewing daily scores.

```jsx
// src/hooks/useScores.js
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase } from '../lib/supabase';

export function useScores(memberId) {
  const queryClient = useQueryClient();

  const getScores = async ({ queryKey }) => {
    const [_, memberId, startDate, endDate] = queryKey;

    let query = supabase.from('daily_scores').select('*');

    if (memberId) {
      query = query.eq('member_id', memberId);
    }

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  };

  const addScore = async scoreData => {
    // Check if score already exists for this day
    const { data: existing } = await supabase
      .from('daily_scores')
      .select('id')
      .eq('member_id', scoreData.member_id)
      .eq('date', scoreData.date)
      .single();

    if (existing) {
      // Update existing score
      const { data, error } = await supabase
        .from('daily_scores')
        .update({
          score: scoreData.score,
          is_vacation: scoreData.is_vacation || false,
          notes: scoreData.notes,
        })
        .eq('id', existing.id)
        .select();

      if (error) throw error;
      return data;
    } else {
      // Insert new score
      const { data, error } = await supabase.from('daily_scores').insert(scoreData).select();

      if (error) throw error;
      return data;
    }
  };

  // Queries and mutations
  const scores = useQuery(['scores', memberId], getScores, { enabled: !!memberId });

  const addScoreMutation = useMutation(addScore, {
    onSuccess: () => {
      queryClient.invalidateQueries(['scores', memberId]);
    },
  });

  return {
    scores: scores.data || [],
    isLoadingScores: scores.isLoading,
    addScore: addScoreMutation.mutate,
    isAddingScore: addScoreMutation.isLoading,
  };
}
```

9. **Build Calendar Interface**

- Title: Create interactive calendar for score entry
- Description: Develop a calendar component for viewing and entering scores by date.

```jsx
// src/components/scoring/ScoreCalendar.jsx
import { useState } from 'react';
import {
  Box,
  Grid,
  Text,
  Flex,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDate, isSameDay } from 'date-fns';
import DailyScoreCard from './DailyScoreCard';
import { useScores } from '../../hooks/useScores';

export default function ScoreCalendar({ childId, month }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { scores, isLoadingScores } = useScores(childId);

  // Generate calendar days
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Find score for a specific day
  const getScoreForDay = day => {
    return scores.find(score => isSameDay(new Date(score.date), day));
  };

  // Handle day click
  const handleDayClick = day => {
    setSelectedDate(day);
    onOpen();
  };

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        {format(month, 'MMMM yyyy')}
      </Text>

      <Grid templateColumns="repeat(7, 1fr)" gap={2}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Box key={day} textAlign="center" fontWeight="bold" py={2}>
            {day}
          </Box>
        ))}

        {days.map(day => {
          const score = getScoreForDay(day);
          const isVacation = score?.is_vacation;

          return (
            <Box
              key={day.toString()}
              bg={
                score ? (isVacation ? 'blue.100' : `green.${100 + score.score * 100}`) : 'gray.100'
              }
              borderRadius="md"
              p={2}
              textAlign="center"
              cursor="pointer"
              onClick={() => handleDayClick(day)}
            >
              <Text>{getDate(day)}</Text>
              {score && (
                <Flex justify="center" align="center" mt={1}>
                  <Text fontWeight="bold">{score.score}</Text>
                  {isVacation && (
                    <Text ml={1} fontSize="xs">
                      (V)
                    </Text>
                  )}
                </Flex>
              )}
            </Box>
          );
        })}
      </Grid>

      {/* Score entry modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</ModalHeader>
          <ModalBody>
            {selectedDate && (
              <DailyScoreCard
                childId={childId}
                date={selectedDate}
                existingScore={getScoreForDay(selectedDate)}
                onSaved={onClose}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
```

### Phase 3: Cycle Management and Reports

10. **Implement Budget Cycle Logic**

- Title: Develop custom budget cycle (25th-24th) calculation
- Description: Create utility functions to handle the custom budget cycle dates.

```javascript
// src/lib/dateUtils.js
import {
  addMonths,
  subMonths,
  getDate,
  setDate,
  isAfter,
  isBefore,
  isEqual,
  format,
} from 'date-fns';

// Get the start and end dates for a budget cycle
export function getBudgetCycleDates(year, month, cycleStartDay = 25) {
  const cycleStart = setDate(new Date(year, month - 1), cycleStartDay);

  // If the current date is before the cycle start day in the selected month,
  // the cycle actually started in the previous month
  const now = new Date();
  if (getDate(now) < cycleStartDay && now.getMonth() === month - 1 && now.getFullYear() === year) {
    return {
      start: setDate(subMonths(new Date(year, month - 1), 1), cycleStartDay),
      end: setDate(new Date(year, month - 1), cycleStartDay - 1),
    };
  }

  return {
    start: cycleStart,
    end: setDate(addMonths(cycleStart, 1), cycleStartDay - 1),
  };
}

// Get the current budget cycle dates
export function getCurrentBudgetCycle(cycleStartDay = 25) {
  const today = new Date();
  const thisMonth = today.getMonth() + 1;
  const thisYear = today.getFullYear();

  // If today is before the cycle start day, the current cycle started last month
  if (getDate(today) < cycleStartDay) {
    return getBudgetCycleDates(
      thisMonth === 1 ? thisYear - 1 : thisYear,
      thisMonth === 1 ? 12 : thisMonth - 1,
      cycleStartDay
    );
  }

  // Otherwise it started this month
  return getBudgetCycleDates(thisYear, thisMonth, cycleStartDay);
}

// Check if a date is within a given budget cycle
export function isDateInBudgetCycle(date, cycleYear, cycleMonth, cycleStartDay = 25) {
  const { start, end } = getBudgetCycleDates(cycleYear, cycleMonth, cycleStartDay);
  return (
    (isAfter(date, start) || isEqual(date, start)) && (isBefore(date, end) || isEqual(date, end))
  );
}

// Format a budget cycle for display (e.g., "Jan 25 - Feb 24, 2025")
export function formatBudgetCycle(cycleYear, cycleMonth, cycleStartDay = 25) {
  const { start, end } = getBudgetCycleDates(cycleYear, cycleMonth, cycleStartDay);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}
```

11. **Create Monthly Summary Component**

- Title: Build monthly summary and allowance calculation interface
- Description: Develop a component to display monthly summaries and calculate allowances.

```jsx
// src/components/summary/MonthlySummary.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Select,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { format, getYear, getMonth } from 'date-fns';
import { useScores } from '../../hooks/useScores';
import { useFamily } from '../../hooks/useFamily';
import { getBudgetCycleDates, formatBudgetCycle } from '../../lib/dateUtils';
import { calculateAllowance } from '../../lib/scoreUtils';

export default function MonthlySummary() {
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()) + 1);
  const { children } = useFamily();

  // Get budget cycle dates
  const { start, end } = getBudgetCycleDates(selectedYear, selectedMonth);

  // Prepare year and month options
  const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Monthly Summary
      </Heading>

      <HStack spacing={4} mb={6}>
        <Select
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          width="150px"
        >
          {months.map(month => (
            <option key={month} value={month}>
              {format(new Date(2000, month - 1), 'MMMM')}
            </option>
          ))}
        </Select>

        <Select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          width="120px"
        >
          {years.map(year => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>

        <Text fontWeight="medium">Cycle: {formatBudgetCycle(selectedYear, selectedMonth)}</Text>
      </HStack>

      <Divider mb={6} />

      <SimpleGrid columns={{ base: 1, md: children?.length || 1 }} spacing={6}>
        {children?.map(child => (
          <ChildSummary
            key={child.id}
            child={child}
            startDate={format(start, 'yyyy-MM-dd')}
            endDate={format(end, 'yyyy-MM-dd')}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}

function ChildSummary({ child, startDate, endDate }) {
  const { scores, isLoadingScores } = useScores(child.id, startDate, endDate);

  const [summary, setSummary] = useState({
    totalDays: 0,
    scoredDays: 0,
    totalScore: 0,
    averageScore: 0,
    allowancePercentage: 0,
    finalAllowance: 0,
  });

  useEffect(() => {
    if (scores && scores.length > 0) {
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const scoredDays = scores.length;
      const average = scoredDays > 0 ? totalScore / scoredDays : 0;
      const allowancePercentage = Math.min(100, Math.round(average * 20)); // 5 stars = 100%

      setSummary({
        totalDays: 30, // Approximate, could calculate actual days in cycle
        scoredDays,
        totalScore,
        averageScore: average.toFixed(1),
        allowancePercentage,
        finalAllowance: calculateAllowance(child.base_allowance, allowancePercentage / 100),
      });
    }
  }, [scores, child]);

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm">
      <Heading size="md" mb={4}>
        {child.name}
      </Heading>

      <SimpleGrid columns={2} spacing={4} mb={4}>
        <Stat>
          <StatLabel>Average Score</StatLabel>
          <StatNumber>{summary.averageScore}/5</StatNumber>
          <StatHelpText>From {summary.scoredDays} days</StatHelpText>
        </Stat>

        <Stat>
          <StatLabel>Allowance</StatLabel>
          <StatNumber>R{summary.finalAllowance.toFixed(2)}</StatNumber>
          <StatHelpText>{summary.allowancePercentage}% of base</StatHelpText>
        </Stat>
      </SimpleGrid>

      <Divider mb={4} />

      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th isNumeric>Score</Th>
            <Th>Vacation</Th>
          </Tr>
        </Thead>
        <Tbody>
          {isLoadingScores ? (
            <Tr>
              <Td colSpan={3} textAlign="center">
                Loading...
              </Td>
            </Tr>
          ) : (
            scores?.map(score => (
              <Tr key={score.id}>
                <Td>{format(new Date(score.date), 'MMM d')}</Td>
                <Td isNumeric>{score.score}</Td>
                <Td>{score.is_vacation ? 'Yes' : 'No'}</Td>
              </Tr>
            ))
          )}
          {!isLoadingScores && (!scores || scores.length === 0) && (
            <Tr>
              <Td colSpan={3} textAlign="center">
                No scores recorded yet
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}
```

12. **Create Vacation Day Selection**

- Title: Build vacation day selection interface
- Description: Create a component for selecting multiple days as vacation days.

````jsx
// src/components/scoring/VacationDaySelector.jsx
import { useState } from 'react';
import {
    Box, Button, FormControl, FormLabel,
    Heading,
    12. **Create Vacation Day Selection**
- Title: "Build vacation day selection interface"
- Description: Create a component for selecting multiple days as vacation days.
```jsx
// src/components/scoring/VacationDaySelector.jsx
import { useState } from 'react';
import {
    Box, Button, FormControl, FormLabel,
    Heading, Input, Stack, HStack, Text,
    useToast, NumberInput, NumberInputField,
    NumberInputStepper, NumberIncrementStepper,
    NumberDecrementStepper
} from '@chakra-ui/react';
import { format, isValid, parseISO } from 'date-fns';
import { useScores } from '../../hooks/useScores';
import { useFamily } from '../../hooks/useFamily';

export default function VacationDaySelector({ childId }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [score, setScore] = useState(3);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toast = useToast();
    const { markVacationDays, isMarkingVacation } = useScores(childId);

    const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (!isValid(start) || !isValid(end)) {
        toast({
        title: 'Invalid dates',
        description: 'Please provide valid start and end dates',
        status: 'error',
        duration: 3000,
        isClosable: true,
        });
        return;
    }

    if (start > end) {
        toast({
        title: 'Invalid date range',
        description: 'End date must be after start date',
        status: 'error',
        duration: 3000,
        isClosable: true,
        });
        return;
    }

    // Generate dates in range
    setIsSubmitting(true);
    const dates = [];
    let current = new Date(start);
    const endTime = end.getTime();

    while (current.getTime() <= endTime) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current.setDate(current.getDate() + 1);
    }

    try {
        await markVacationDays({
        childId,
        dates,
        score
        });

        toast({
        title: 'Vacation days marked',
        description: `${dates.length} days marked as vacation`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        });

        // Reset form
        setStartDate('');
        setEndDate('');
    } catch (error) {
        toast({
        title: 'Error marking vacation days',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        });
    } finally {
        setIsSubmitting(false);
    }
    };

    return (
    <Box as="form" onSubmit={handleSubmit}>
        <Heading size="md" mb={4}>Mark Vacation Days</Heading>

        <Stack spacing={4}>
        <FormControl isRequired>
            <FormLabel>Start Date</FormLabel>
            <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            />
        </FormControl>

        <FormControl isRequired>
            <FormLabel>End Date</FormLabel>
            <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            />
        </FormControl>

        <FormControl>
            <FormLabel>Default Score</FormLabel>
            <NumberInput
            min={1}
            max={5}
            value={score}
            onChange={(valueString) => setScore(Number(valueString))}
            >
            <NumberInputField />
            <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
            </NumberInputStepper>
            </NumberInput>
            <Text fontSize="sm" color="gray.600" mt={1}>
            Score to assign to all vacation days
            </Text>
        </FormControl>

        <Button
            type="submit"
            colorScheme="blue"
            isLoading={isSubmitting || isMarkingVacation}
        >
            Mark Vacation Days
        </Button>
        </Stack>
    </Box>
    );
}
````

13. **Daily Score Entry Component**

- Title: Create score entry component for individual days
- Description: Build a form component for entering daily scores.

```jsx
// src/components/scoring/DailyScoreCard.jsx
import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  HStack,
  Switch,
  useToast,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useScores } from '../../hooks/useScores';
import { useFamily } from '../../hooks/useFamily';

export default function DailyScoreCard({ childId, date, existingScore, onSaved }) {
  const [score, setScore] = useState(existingScore?.score || 3);
  const [isVacation, setIsVacation] = useState(existingScore?.is_vacation || false);
  const [notes, setNotes] = useState(existingScore?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();
  const { addScore, isAddingScore } = useScores(childId);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addScore({
        child_id: childId,
        date: format(date, 'yyyy-MM-dd'),
        score: Number(score),
        is_vacation: isVacation,
        notes,
      });

      toast({
        title: 'Score saved',
        description: `Score for ${format(date, 'MMMM d, yyyy')} saved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      toast({
        title: 'Error saving score',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <FormControl mb={4}>
        <FormLabel>Score (1-5)</FormLabel>
        <RadioGroup value={String(score)} onChange={setScore}>
          <HStack spacing={4}>
            {[1, 2, 3, 4, 5].map(value => (
              <Radio key={value} value={String(value)}>
                {value}
              </Radio>
            ))}
          </HStack>
        </RadioGroup>
      </FormControl>

      <FormControl display="flex" alignItems="center" mb={4}>
        <FormLabel mb="0">Vacation Day</FormLabel>
        <Switch isChecked={isVacation} onChange={e => setIsVacation(e.target.checked)} />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Notes</FormLabel>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes about today's behavior"
          rows={3}
        />
      </FormControl>

      <Button
        type="submit"
        colorScheme="blue"
        isLoading={isSubmitting || isAddingScore}
        width="full"
      >
        Save Score
      </Button>
    </Box>
  );
}
```

### Phase 4: Final Components and Integration

14. **Implement Dashboard Components**

- Title: Build dashboard views for parents and children
- Description: Create the main dashboard interfaces for different user roles.

```jsx
// src/components/dashboard/ParentDashboard.jsx
import { useState } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  Button,
  HStack,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';
import { format, subDays } from 'date-fns';
import { useFamily } from '../../hooks/useFamily';
import { useScores } from '../../hooks/useScores';
import ScoreCalendar from '../scoring/ScoreCalendar';
import DailyScoreCard from '../scoring/DailyScoreCard';
import VacationDaySelector from '../scoring/VacationDaySelector';
import ScoreChart from './ScoreChart';

export default function ParentDashboard() {
  const [selectedChild, setSelectedChild] = useState(null);
  const [scoreDate, setScoreDate] = useState(new Date());
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { children, isLoadingChildren } = useFamily();

  const handleChildChange = e => {
    setSelectedChild(e.target.value);
  };

  const today = new Date();

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Parent Dashboard
      </Heading>

      {/* Child selector */}
      <HStack mb={6}>
        <Text>Select Child:</Text>
        <Select
          placeholder="Select child"
          value={selectedChild || ''}
          onChange={handleChildChange}
          isDisabled={isLoadingChildren || !children?.length}
          width="200px"
        >
          {children?.map(child => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </Select>

        <Button onClick={onOpen} isDisabled={!selectedChild} colorScheme="blue" size="sm">
          Add Today's Score
        </Button>
      </HStack>

      {/* Quick stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <QuickStatCard childId={selectedChild} days={7} label="Last 7 Days" />
        <QuickStatCard childId={selectedChild} days={30} label="Last 30 Days" />
        <QuickStatCard childId={selectedChild} isCycle={true} label="Current Cycle" />
      </SimpleGrid>

      {/* Tabs for different views */}
      <Tabs isLazy>
        <TabList>
          <Tab>Calendar</Tab>
          <Tab>Trends</Tab>
          <Tab>Vacation</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {selectedChild ? (
              <ScoreCalendar childId={selectedChild} month={scoreDate} />
            ) : (
              <Text>Please select a child to view their calendar</Text>
            )}
          </TabPanel>

          <TabPanel>
            {selectedChild ? (
              <ScoreChart childId={selectedChild} />
            ) : (
              <Text>Please select a child to view their trends</Text>
            )}
          </TabPanel>

          <TabPanel>
            {selectedChild ? (
              <VacationDaySelector childId={selectedChild} />
            ) : (
              <Text>Please select a child to mark vacation days</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal for quick score entry */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Score for {format(today, 'MMMM d, yyyy')}</ModalHeader>
          <ModalBody>
            {selectedChild && (
              <DailyScoreCard childId={selectedChild} date={today} onSaved={onClose} />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// Helper component for stats
function QuickStatCard({ childId, days, isCycle, label }) {
  const [stats, setStats] = useState({
    average: 0,
    daysRecorded: 0,
    percentComplete: 0,
  });

  const { scores, isLoadingScores } = useScores(childId);

  // Compute stats (would calculate based on actual cycle or date range)
  // This would need to be expanded in a real component

  return (
    <Card>
      <CardHeader pb={0}>
        <Text fontWeight="medium">{label}</Text>
      </CardHeader>
      <CardBody>
        <Stat>
          <StatNumber>{stats.average.toFixed(1)}/5</StatNumber>
          <StatHelpText>{stats.daysRecorded} days recorded</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
}
```

15. **Create Child Dashboard**

- Title: Implement child-friendly dashboard view
- Description: Create a simplified dashboard for children to view their own progress.

```jsx
// src/components/dashboard/ChildDashboard.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Progress,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { useScores } from '../../hooks/useScores';
import { getCurrentBudgetCycle, formatBudgetCycle } from '../../lib/dateUtils';
import ScoreChart from './ScoreChart';

export default function ChildDashboard({ childId, childName }) {
  const [stats, setStats] = useState({
    average: 0,
    daysRecorded: 0,
    percentComplete: 0,
    allowanceProgress: 0,
  });

  const { start, end } = getCurrentBudgetCycle();
  const { scores, isLoadingScores } = useScores(
    childId,
    format(start, 'yyyy-MM-dd'),
    format(end, 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (scores && scores.length > 0) {
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const average = totalScore / scores.length;
      const allowanceProgress = Math.min(100, average * 20); // 5 = 100%

      setStats({
        average,
        daysRecorded: scores.length,
        percentComplete: 0, // Would calculate from cycle dates
        allowanceProgress,
      });
    }
  }, [scores]);

  return (
    <Box>
      <Heading size="lg" mb={2}>
        {childName}'s Dashboard
      </Heading>
      <Text mb={6}>Keep up the great work to earn your full allowance!</Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Card>
          <CardHeader pb={0}>
            <Text fontWeight="medium">Current Cycle Progress</Text>
            <Text fontSize="sm" color="gray.500">
              {formatBudgetCycle()}
            </Text>
          </CardHeader>
          <CardBody>
            <Stat mb={4}>
              <StatLabel>Average Score</StatLabel>
              <StatNumber>{stats.average.toFixed(1)}/5</StatNumber>
              <StatHelpText>{stats.daysRecorded} days recorded</StatHelpText>
            </Stat>

            <Box mb={2}>
              <HStack mb={1} justify="space-between">
                <Text fontSize="sm">Allowance Progress</Text>
                <Text fontSize="sm" fontWeight="bold">
                  {stats.allowanceProgress.toFixed(0)}%
                </Text>
              </HStack>
              <Progress
                value={stats.allowanceProgress}
                colorScheme="green"
                borderRadius="md"
                height="12px"
              />
            </Box>

            <HStack mt={4} spacing={1}>
              {[1, 2, 3, 4, 5].map(score => (
                <Icon
                  key={score}
                  as={stats.average >= score ? FaStar : FaRegStar}
                  color="yellow.400"
                  boxSize={6}
                />
              ))}
            </HStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader pb={0}>
            <Text fontWeight="medium">Recent Scores</Text>
          </CardHeader>
          <CardBody>
            {/* Would render last 5 daily scores */}
            <Text>Recent daily scores would go here</Text>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardHeader>
          <Text fontWeight="medium">Your Score History</Text>
        </CardHeader>
        <CardBody>
          <ScoreChart childId={childId} simplified={true} />
        </CardBody>
      </Card>
    </Box>
  );
}
```

16. **Build Data Visualization**

- Title: Create score trend visualization
- Description: Implement charts to visualize score trends over time.

```jsx
// src/components/dashboard/ScoreChart.jsx
import { useState, useEffect } from 'react';
import { Box, Text, Select, HStack } from '@chakra-ui/react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { useScores } from '../../hooks/useScores';

export default function ScoreChart({ childId, simplified = false }) {
  const [timeRange, setTimeRange] = useState('1month');
  const [chartData, setChartData] = useState([]);

  // Get scores
  const { scores, isLoadingScores } = useScores(childId);

  // Prepare chart data whenever scores change
  useEffect(() => {
    if (!scores || scores.length === 0) return;

    // Determine date range based on selected time period
    const today = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case '1month':
        startDate = subMonths(today, 1);
        endDate = today;
        break;
      case '3months':
        startDate = subMonths(today, 3);
        endDate = today;
        break;
      case 'currentMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        startDate = subMonths(today, 1);
        endDate = today;
    }

    // Generate all days in the interval
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Map scores to days
    const data = days.map(day => {
      const score = scores.find(s => isSameDay(new Date(s.date), day));
      return {
        date: format(day, 'MMM dd'),
        score: score ? score.score : null,
        isVacation: score ? score.is_vacation : false,
      };
    });

    setChartData(data);
  }, [scores, timeRange]);

  return (
    <Box>
      {!simplified && (
        <HStack justify="flex-end" mb={4}>
          <Text>Time Range:</Text>
          <Select value={timeRange} onChange={e => setTimeRange(e.target.value)} width="150px">
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="currentMonth">Current Month</option>
          </Select>
        </HStack>
      )}

      <Box height="300px">
        {isLoadingScores ? (
          <Text textAlign="center">Loading chart data...</Text>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={simplified ? 2 : 1} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip
                formatter={(value, name) => [value, 'Score']}
                labelFormatter={label => `Date: ${label}`}
              />
              {!simplified && <Legend />}
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3182CE"
                strokeWidth={2}
                connectNulls={true}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Daily Score"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text textAlign="center">No data available for the selected period</Text>
        )}
      </Box>
    </Box>
  );
}
```

17. **Add Allowance Calculation**

- Title: Implement allowance calculation logic
- Description: Create utility functions for calculating allowances based on scores.

```javascript
// src/lib/scoreUtils.js

/**
 * Calculate allowance based on base amount and performance multiplier
 * @param {number} baseAmount - Base allowance amount
 * @param {number} performanceMultiplier - Performance multiplier (0-1)
 * @returns {number} - Final allowance amount
 */
export function calculateAllowance(baseAmount, performanceMultiplier) {
  // Ensure multiplier is between 0 and 1
  const multiplier = Math.max(0, Math.min(1, performanceMultiplier));

  // Calculate final amount
  return baseAmount * multiplier;
}

/**
 * Calculate average score from an array of scores
 * @param {Array} scores - Array of score objects
 * @returns {Object} - Score statistics
 */
export function calculateScoreStats(scores) {
  if (!scores || scores.length === 0) {
    return {
      average: 0,
      count: 0,
      min: 0,
      max: 0,
      allowancePercentage: 0,
    };
  }

  const total = scores.reduce((sum, score) => sum + score.score, 0);
  const count = scores.length;
  const average = total / count;

  // Calculate min and max scores
  const scoreValues = scores.map(s => s.score);
  const min = Math.min(...scoreValues);
  const max = Math.max(...scoreValues);

  // Convert average to percentage (5 stars = 100%)
  const allowancePercentage = (average / 5) * 100;

  return {
    average,
    count,
    min,
    max,
    allowancePercentage,
  };
}

/**
 * Group scores by time period (day, week, month)
 * @param {Array} scores - Array of score objects
 * @param {string} grouping - Grouping period ('day', 'week', 'month')
 * @returns {Object} - Grouped scores
 */
export function groupScoresByPeriod(scores, grouping = 'day') {
  if (!scores || scores.length === 0) {
    return {};
  }

  return scores.reduce((groups, score) => {
    const date = new Date(score.date);
    let key;

    switch (grouping) {
      case 'week':
        // Get ISO week (1-52)
        const weekNum = getISOWeek(date);
        const year = getYear(date);
        key = `${year}-W${weekNum}`;
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      case 'day':
      default:
        key = format(date, 'yyyy-MM-dd');
    }

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(score);
    return groups;
  }, {});
}
```

### Phase 5: Final Integration and Deployment

18. **Set Up Routing and Navigation**

- Title: Configure navigation and protected routes
- Description: Implement routing with authentication protection.

```jsx
// src/App.jsx
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/auth/PrivateRoute';
import RoleRoute from './components/auth/RoleRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ParentDashboard from './pages/ParentDashboard';
import MemberDashboard from './pages/MemberDashboard';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import theme from './theme';

// Create React Query client
const queryClient = new QueryClient();

function App() {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Role-based dashboard route */}
                <Route path="dashboard" element={<RoleBasedDashboard />} />

                {/* Parent-only routes */}
                <Route
                  path="parent"
                  element={
                    <RoleRoute allowedRoles={['parent']}>
                      <ParentDashboard />
                    </RoleRoute>
                  }
                />

                <Route
                  path="member/:memberId"
                  element={
                    <RoleRoute allowedRoles={['parent']}>
                      <MemberDashboard />
                    </RoleRoute>
                  }
                />

                <Route
                  path="settings"
                  element={
                    <RoleRoute allowedRoles={['parent']}>
                      <Settings />
                    </RoleRoute>
                  }
                />

                <Route
                  path="reports"
                  element={
                    <RoleRoute allowedRoles={['parent']}>
                      <Reports />
                    </RoleRoute>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

// Helper component to redirect based on role
function RoleBasedDashboard() {
  const { userRole, familyMember } = useAuth();

  if (userRole === 'parent') {
    return <Navigate to="/parent" replace />;
  } else if (userRole === 'child') {
    return <MemberDashboard memberId={familyMember?.id} />;
  }

  // Fallback
  return <Navigate to="/login" replace />;
}

export default App;
```

- Role-based route component

```jsx
// src/components/auth/RoleRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
  const { user, userRole } = useAuth();

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role not in allowed roles, redirect to dashboard
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Otherwise render children
  return children;
}

// Partial update for Settings.jsx - Add Family Member Modal
function AddMemberModal({ isOpen, onClose, familyId }) {
  const toast = useToast();
  const { addFamilyMember, isAddingMember } = useFamily();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'child',
    base_allowance: 0,
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await addFamilyMember({
        ...formData,
        family_id: familyId,
      });

      toast({
        title: 'Family member added',
        description: `${formData.name} was added successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'child',
        base_allowance: 0,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error adding family member',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Family Member</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select name="role" value={formData.role} onChange={handleInputChange}>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
              </Select>
            </FormControl>

            {formData.role === 'child' && (
              <FormControl>
                <FormLabel>Base Allowance</FormLabel>
                <NumberInput
                  min={0}
                  precision={2}
                  step={10}
                  value={formData.base_allowance}
                  onChange={valueString =>
                    setFormData(prev => ({
                      ...prev,
                      base_allowance: Number(valueString),
                    }))
                  }
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Monthly base amount before adjustments
                </Text>
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isAddingMember}>
            Add Member
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

19. **Create Settings Page**

- Title: Build settings page for family configuration
- Description: Create interface for configuring family settings and adding/editing children.

```jsx
// src/pages/Settings.jsx
import { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Divider,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Card,
  CardHeader,
  CardBody,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useFamily } from '../hooks/useFamily';

export default function Settings() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { family, children, addChild, isAddingChild } = useFamily();

  const [newChild, setNewChild] = useState({
    name: '',
    base_allowance: 0,
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewChild(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAllowanceChange = value => {
    setNewChild(prev => ({
      ...prev,
      base_allowance: Number(value),
    }));
  };

  const handleAddChild = async () => {
    if (!newChild.name) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the child',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await addChild({
        ...newChild,
        family_id: family.id,
      });

      toast({
        title: 'Child added',
        description: `${newChild.name} was added successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setNewChild({
        name: '',
        base_allowance: 0,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error adding child',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>
        Family Settings
      </Heading>

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Family Members</Heading>
        </CardHeader>
        <CardBody>
          <HStack mb={4} justify="space-between">
            <Text>Manage your family members and their allowances</Text>
            <Button colorScheme="blue" size="sm" onClick={onOpen}>
              Add Child
            </Button>
          </HStack>

          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th isNumeric>Base Allowance</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {children?.map(child => (
                <Tr key={child.id}>
                  <Td>{child.name}</Td>
                  <Td isNumeric>R{child.base_allowance.toFixed(2)}</Td>
                  <Td>
                    <Button size="xs" variant="outline">
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
              {(!children || children.length === 0) && (
                <Tr>
                  <Td colSpan={3} textAlign="center">
                    No children added yet
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Budget Cycle Settings</Heading>
        </CardHeader>
        <CardBody>
          <Text mb={4}>Configure your custom budget cycle and other settings</Text>

          <FormControl mb={4}>
            <FormLabel>Budget Cycle Start Day</FormLabel>
            <NumberInput defaultValue={25} min={1} max={28}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Default Vacation Score</FormLabel>
            <NumberInput defaultValue={3} min={1} max={5}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <Button colorScheme="blue">Save Settings</Button>
        </CardBody>
      </Card>

      {/* Modal for adding a child */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Child</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={newChild.name}
                  onChange={handleInputChange}
                  placeholder="Child's name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Base Allowance</FormLabel>
                <NumberInput
                  min={0}
                  precision={2}
                  step={10}
                  value={newChild.base_allowance}
                  onChange={handleAllowanceChange}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Monthly base amount before adjustments
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddChild} isLoading={isAddingChild}>
              Add Child
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
```

20. **Create Main Layout Component**

- Title: Design responsive layout and navigation
- Description: Develop the main layout component with responsive design and navigation.

```jsx
// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  IconButton,
  Link,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  HStack,
  Text,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Container,
  Divider,
} from '@chakra-ui/react';
import { HamburgerIcon, SettingsIcon, CalendarIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useAuth } from '../../context/AuthContext';
import { useFamily } from '../../hooks/useFamily';

export default function Layout() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signOut } = useAuth();
  const { family, children } = useFamily();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Box minH="100vh">
      {/* Header */}
      <Flex
        as="header"
        align="center"
        justify="space-between"
        py={4}
        px={8}
        bg="white"
        borderBottomWidth="1px"
        shadow="sm"
      >
        <HStack>
          <IconButton
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onOpen}
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
          />
          <RouterLink to="/">
            <Text fontSize="xl" fontWeight="bold">
              Family Allowance Tracker
            </Text>
          </RouterLink>
        </HStack>

        <HStack spacing={4}>
          <Menu>
            <MenuButton as={Box} cursor="pointer">
              <HStack>
                <Avatar size="sm" name={user?.email} />
                <Text display={{ base: 'none', md: 'block' }}>{family?.name || 'My Family'}</Text>
                <ChevronDownIcon />
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/settings">
                Settings
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="start" spacing={4}>
              <Link as={RouterLink} to="/parent" onClick={onClose}>
                <HStack>
                  <CalendarIcon />
                  <Text>Parent Dashboard</Text>
                </HStack>
              </Link>

              <Divider />

              <Text fontWeight="bold">Children</Text>
              {children?.map(child => (
                <Link
                  key={child.id}
                  as={RouterLink}
                  to={`/child/${child.id}`}
                  pl={4}
                  onClick={onClose}
                >
                  {child.name}
                </Link>
              ))}

              <Divider />

              <Link as={RouterLink} to="/reports" onClick={onClose}>
                <HStack>
                  <Icon as={ReportIcon} />
                  <Text>Reports</Text>
                </HStack>
              </Link>

              <Link as={RouterLink} to="/settings" onClick={onClose}>
                <HStack>
                  <SettingsIcon />
                  <Text>Settings</Text>
                </HStack>
              </Link>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop sidebar */}
      <Flex>
        <Box
          as="nav"
          w="250px"
          bg="gray.50"
          p={4}
          minH="calc(100vh - 73px)"
          borderRightWidth="1px"
          display={{ base: 'none', md: 'block' }}
        >
          <VStack align="start" spacing={4}>
            <Link as={RouterLink} to="/parent">
              <HStack>
                <CalendarIcon />
                <Text>Parent Dashboard</Text>
              </HStack>
            </Link>

            <Divider />

            <Text fontWeight="bold">Children</Text>
            {children?.map(child => (
              <Link key={child.id} as={RouterLink} to={`/child/${child.id}`} pl={4}>
                {child.name}
              </Link>
            ))}

            <Divider />

            <Link as={RouterLink} to="/reports">
              <HStack>
                <Icon as={ReportIcon} />
                <Text>Reports</Text>
              </HStack>
            </Link>

            <Link as={RouterLink} to="/settings">
              <HStack>
                <SettingsIcon />
                <Text>Settings</Text>
              </HStack>
            </Link>
          </VStack>
        </Box>

        {/* Main content */}
        <Box flex="1" p={6} bg="gray.50">
          <Container maxW="container.xl">
            <Outlet />
          </Container>
        </Box>
      </Flex>
    </Box>
  );
}
```

21. **Complete Login Page**

- Title: Create login and signup functionality
- Description: Build the login page with authentication and signup flow.

```jsx
// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Container,
  Card,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    familyName: '',
  });

  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLoginChange = e => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignupChange = e => {
    const { name, value } = e.target;
    setSignupForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async e => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      // Success - will auto-navigate due to auth state change
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async e => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            family_name: signupForm.familyName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Account created',
        description: 'Please check your email to confirm your account',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" py={12} px={4} bg="gray.50">
      <Container maxW="md">
        <Card>
          <CardBody>
            <VStack spacing={6} align="center" w="full">
              <Heading as="h1" size="xl">
                Family Allowance Tracker
              </Heading>

              <Text color="gray.600">Track your children's allowances with ease</Text>

              <Tabs isFitted variant="enclosed" width="full">
                <TabList mb="1em">
                  <Tab>Login</Tab>
                  <Tab>Sign Up</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <form onSubmit={handleLogin}>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                          <Input
                            name="email"
                            type="email"
                            value={loginForm.email}
                            onChange={handleLoginChange}
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Password</FormLabel>
                          <InputGroup>
                            <Input
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              value={loginForm.password}
                              onChange={handleLoginChange}
                            />
                            <InputRightElement>
                              <IconButton
                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                variant="ghost"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="blue"
                          width="full"
                          mt={4}
                          isLoading={isLoading}
                        >
                          Sign In
                        </Button>
                      </VStack>
                    </form>
                  </TabPanel>

                  <TabPanel>
                    <form onSubmit={handleSignup}>
                      <VStack spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Email</FormLabel>
                          <Input
                            name="email"
                            type="email"
                            value={signupForm.email}
                            onChange={handleSignupChange}
                          />
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Password</FormLabel>
                          <InputGroup>
                            <Input
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              value={signupForm.password}
                              onChange={handleSignupChange}
                            />
                            <InputRightElement>
                              <IconButton
                                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                                variant="ghost"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              />
                            </InputRightElement>
                          </InputGroup>
                        </FormControl>

                        <FormControl isRequired>
                          <FormLabel>Family Name</FormLabel>
                          <Input
                            name="familyName"
                            value={signupForm.familyName}
                            onChange={handleSignupChange}
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          colorScheme="blue"
                          width="full"
                          mt={4}
                          isLoading={isLoading}
                        >
                          Create Account
                        </Button>
                      </VStack>
                    </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}
```

22. **Finalize Deployment Setup**

- Title: Configure GitHub Pages and environment variables
- Description: Set up the final deployment configuration and test deployment.

```jsx
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/family-allowance-tracker/',
  build: {
    outDir: 'dist',
  },
});

// Add a public/_redirects file for SPA routing
// * /index.html 200
```

## Testing Plan

1. **Unit Testing**

- Test individual utility functions
- Test hooks in isolation
- Test component rendering

2. **Integration Testing**

- Test authentication flow
- Test data fetching and mutations
- Test budget cycle calculations

3. **End-to-End Testing**

- Test complete user flows
- Test mobile and desktop responsiveness
- Test offline functionality

## Launch Checklist

1. **Pre-Launch**

- Complete all core functionality
- Review and fix any bugs
- Test on mobile and desktop devices
- Ensure proper error handling

2. **Launch**

- Deploy to GitHub Pages
- Configure Supabase production environment
- Set up CI/CD pipeline

3. **Post-Launch**

- Monitor for any issues
- Gather initial feedback
- Plan next iteration of features

## Timeline

1. **Week 1: Setup and Foundation** (Tasks 1-5)

- Initialize project and install dependencies
- Set up Supabase integration
- Design database schema
- Configure CI/CD

2. **Week 2: Core Functionality** (Tasks 6-10)

- Implement authentication
- Create family management
- Build scoring system
- Develop calendar interface

3. **Week 3: Advanced Features** (Tasks 11-17)

- Implement budget cycle logic
- Create monthly summary
- Build vacation day selection
- Add data visualization

4. **Week 4: Integration and Testing** (Tasks 18-22)

- Set up routing and navigation
- Create settings page
- Design responsive layout
- Finalize deployment
- Conduct testing and bug fixes

This detailed plan provides a roadmap for implementing the Family Allowance Tracker web app. By following these structured steps, you'll be able to build a functional, user-friendly application that helps parents track their children's allowances based on their daily behavior scores.
