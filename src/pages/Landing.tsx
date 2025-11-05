import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Flame, Trophy, Users, Target, Bell, School, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByFirebaseUid } from '@/lib/api';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (user) {
      // User is already logged in, check their status and redirect accordingly
      try {
        const userData = await getUserByFirebaseUid(user.uid);
        const role = userData.role || 'user';
        
        if (role === 'superAdmin') {
          navigate('/super-admin');
        } else if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'deptAdmin') {
          navigate('/dept-admin');
        } else {
          // Check if user has completed onboarding
          // User is considered onboarded if:
          // 1. isOnboarded is explicitly true, OR
          // 2. They have both fullName and college (backward compatibility)
          const isOnboarded = userData.isOnboarded === true || (!!userData.fullName && !!userData.college);
          if (!isOnboarded) {
            navigate('/onboarding');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error: any) {
        // User might not exist in MongoDB yet, go to onboarding
        navigate('/onboarding');
      }
    } else {
      // User is not logged in, go to auth page
      navigate('/auth');
    }
  };
  const features = [
    {
      icon: Flame,
      title: 'Track Your Streak',
      description: 'Maintain daily coding consistency with visual streak tracking and performance analytics.',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Get notified via app, SMS, or calls. Friends can nudge you to keep the streak alive.',
    },
    {
      icon: Users,
      title: 'Social Network',
      description: 'Connect with friends, share achievements, and motivate each other to code daily.',
    },
    {
      icon: Trophy,
      title: 'Leaderboards',
      description: 'Compete globally, within your college, or by department. Rise to the top!',
    },
    {
      icon: Target,
      title: 'Custom Goals',
      description: 'Set personalized targets and track your progress with milestone notifications.',
    },
    {
      icon: School,
      title: 'College Integration',
      description: 'Join your college community. Admins can monitor and promote coding culture.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-streak/10 via-challenge/10 to-premium/10" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6">
              <Flame className="h-4 w-4 text-streak" />
              <span className="text-sm font-medium">Join 10,000+ coders maintaining their streak</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Never Break Your{' '}
              <span className="bg-gradient-streak bg-clip-text text-transparent">
                Coding Streak
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stay consistent, compete with friends, and build your coding legacy. 
              Track daily problems, set goals, and climb the leaderboards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-streak border-0 text-white hover:opacity-90 text-lg px-8"
                onClick={handleGetStarted}
              >
                <Flame className="mr-2 h-5 w-5" />
                Start Your Streak
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-streak">10K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-challenge">500+</div>
                <div className="text-sm text-muted-foreground">Colleges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">1M+</div>
                <div className="text-sm text-muted-foreground">Problems Solved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Stay Consistent</h2>
            <p className="text-xl text-muted-foreground">Powerful features to keep you motivated and competitive</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow bg-card border-border">
                <div className="w-12 h-12 rounded-lg bg-gradient-streak flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center bg-gradient-to-br from-card to-muted/30 border-2 border-streak/20">
            <Award className="h-16 w-16 text-streak mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Ready to Build Your Legacy?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are crushing their coding goals every single day.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-streak border-0 text-white hover:opacity-90 text-lg px-12"
              onClick={handleGetStarted}
            >
              Get Started Free
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 CodeStreak. Built for coders, by coders.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
