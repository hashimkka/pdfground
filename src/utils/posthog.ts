import posthog from 'posthog-js';

/**
 * Initialize PostHog analytics
 * Privacy-focused configuration for offline-first app
 */
export const initPostHog = (): void => {
    const apiKey = import.meta.env.VITE_POSTHOG_KEY;
    const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!apiKey) {
        console.warn('PostHog API key not found. Analytics disabled.');
        return;
    }

    try {
        posthog.init(apiKey, {
            api_host: apiHost,
            // Privacy-focused settings
            autocapture: false, // Manual tracking only - no automatic event capture
            capture_pageview: false, // Manual pageview tracking
            disable_session_recording: true, // Respect user privacy
            loaded: (_posthog) => {
                if (import.meta.env.DEV) {
                    console.log('PostHog initialized successfully');
                }
                // Track app opened
                trackEvent('app_opened');
            },
        });
    } catch (error) {
        console.error('Failed to initialize PostHog:', error);
    }
};

/**
 * Track a custom event
 * @param eventName - Name of the event (e.g., 'pdf_merged')
 * @param properties - Optional properties to attach to the event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
    try {
        if (posthog.__loaded) {
            posthog.capture(eventName, properties);
        }
    } catch (error) {
        console.error('Failed to track event:', error);
    }
};

/**
 * Track page view
 * @param pageName - Name of the page
 */
export const trackPageView = (pageName: string): void => {
    trackEvent('page_viewed', {
        page: pageName,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Track PDF operation
 * @param operation - Type of operation (merge, split, compress, etc.)
 * @param success - Whether the operation succeeded
 * @param properties - Additional properties
 */
export const trackPDFOperation = (
    operation: string,
    success: boolean,
    properties?: Record<string, any>
): void => {
    trackEvent(`pdf_${operation}`, {
        success,
        timestamp: new Date().toISOString(),
        ...properties,
    });
};

/**
 * Identify user (optional - only if user opts in)
 * @param userId - Unique user identifier
 * @param properties - User properties
 */
export const identifyUser = (userId: string, properties?: Record<string, any>): void => {
    try {
        if (posthog.__loaded) {
            posthog.identify(userId, properties);
        }
    } catch (error) {
        console.error('Failed to identify user:', error);
    }
};

/**
 * Reset user identity (for logout or privacy)
 */
export const resetUser = (): void => {
    try {
        if (posthog.__loaded) {
            posthog.reset();
        }
    } catch (error) {
        console.error('Failed to reset user:', error);
    }
};
