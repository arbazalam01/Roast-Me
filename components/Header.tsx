import React from 'react';
import { Button } from './ui/button';
import { Sun, Moon, Flame } from 'lucide-react';
import useThemeStore from '@/store/theme-store';

const Header = ({ toggleTheme, isLoggedIn, onLogin, onLogout }: { 
    toggleTheme: () => void, 
    isLoggedIn: boolean, 
    onLogin: () => void, 
    onLogout: () => void 
}) => {
    const { theme } = useThemeStore();

    return (
        <header className='flex justify-between items-center p-4'>
            <div className='flex items-center'>
                <Flame className='h-8 mr-2 text-destructive' />
                <h1 className='text-xl font-bold'>Roast ME</h1>
            </div>
            <div className='flex items-center'>
                <Button onClick={toggleTheme} className='flex items-center mr-4'>
                    <Sun className={theme === 'dark' ? 'hidden' : ''} />
                    <Moon className={theme === 'light' ? 'hidden' : ''} />
                </Button>
                {isLoggedIn ? (
                    <Button onClick={onLogout}>Sign Out</Button>
                ) : (
                    <Button onClick={onLogin}>Login</Button>
                )}
            </div>
        </header>
    );
};

export default Header;
