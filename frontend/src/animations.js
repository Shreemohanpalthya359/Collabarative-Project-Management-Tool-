/**
 * Shared Framer Motion animation variants for the app.
 * Import what you need: { fadeUp, staggerContainer, scaleIn, slideInLeft, ... }
 */

export const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1, y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 28 }
    },
    exit: { opacity: 0, y: 16, transition: { duration: 0.18 } }
};

export const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.35 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.88 },
    show: {
        opacity: 1, scale: 1,
        transition: { type: 'spring', stiffness: 320, damping: 26 }
    },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } }
};

export const slideInLeft = {
    hidden: { opacity: 0, x: -32 },
    show: {
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 260, damping: 24 }
    }
};

export const slideInRight = {
    hidden: { opacity: 0, x: 32 },
    show: {
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 260, damping: 24 }
    }
};

export const staggerContainer = (staggerChildren = 0.07, delayChildren = 0.1) => ({
    hidden: {},
    show: {
        transition: { staggerChildren, delayChildren }
    }
});

export const cardHover = {
    rest: { scale: 1, y: 0, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    hover: {
        scale: 1.025,
        y: -4,
        boxShadow: '0 12px 40px rgba(99,102,241,0.25)',
        transition: { type: 'spring', stiffness: 400, damping: 22 }
    },
    tap: { scale: 0.97 }
};

export const buttonPress = {
    whileHover: { scale: 1.04 },
    whileTap: { scale: 0.95 }
};

export const listItem = {
    hidden: { opacity: 0, x: -16 },
    show: {
        opacity: 1, x: 0,
        transition: { type: 'spring', stiffness: 300, damping: 26 }
    }
};

export const pageTransition = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1, y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    exit: {
        opacity: 0, y: -12,
        transition: { duration: 0.25 }
    }
};

// Floating particle for backgrounds
export const floatingParticle = (delay = 0, duration = 8) => ({
    animate: {
        y: [0, -20, 0],
        opacity: [0.3, 0.7, 0.3],
        transition: { delay, duration, repeat: Infinity, ease: 'easeInOut' }
    }
});
