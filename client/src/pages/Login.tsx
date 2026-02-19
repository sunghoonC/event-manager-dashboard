/*
 * Design Philosophy: Organic Minimalism
 * - Centered layout with generous breathing room
 * - Soft shadows and subtle depth (card-shadow)
 * - Natural color palette with Sage Green accents
 * - Smooth organic transitions
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay for better UX
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        toast.success('로그인 성공');
        setLocation('/');
      } else {
        toast.error('이메일 또는 비밀번호가 올바르지 않습니다');
      }
      
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-foreground mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            ABLE GYM x NEUMAFIT
          </h1>
          <p className="text-lg text-muted-foreground">
            BURNING 100g 챌린지
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-lg p-8 card-shadow">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@test.com"
                required
                className="organic-transition"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="organic-transition"
              />
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full organic-transition"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </div>

        {/* Test Credentials Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            테스트 계정: test@test.com / test123
          </p>
        </div>
      </div>
    </div>
  );
}
