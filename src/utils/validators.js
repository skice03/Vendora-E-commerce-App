/* ========================================
   Vendora — Client-Side Validators
   ======================================== */

import { MIN_PASSWORD_LENGTH } from './constants.js';

/// Validates an email address format (REQ-04)
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/// Validates password meets minimum length (REQ-04: at least 8 characters)
export function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }
    return password.length >= MIN_PASSWORD_LENGTH;
}

/// Returns a password strength indicator (weak, medium, strong)
export function getPasswordStrength(password) {
    if (!password) {
        return { level: 'none', label: '', percentage: 0 };
    }

    let score = 0;

    if (password.length >= MIN_PASSWORD_LENGTH) {
        score += 1;
    }
    if (password.length >= 12) {
        score += 1;
    }
    if (/[A-Z]/.test(password)) {
        score += 1;
    }
    if (/[a-z]/.test(password)) {
        score += 1;
    }
    if (/[0-9]/.test(password)) {
        score += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }

    if (score <= 2) {
        return { level: 'weak', label: 'Weak', percentage: 33 };
    }
    if (score <= 4) {
        return { level: 'medium', label: 'Medium', percentage: 66 };
    }
    return { level: 'strong', label: 'Strong', percentage: 100 };
}

/// Checks if a required field is not empty
export function isRequired(value) {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
}

/// Validates a field and returns an error message or null
export function validateField(fieldName, value, rules = {}) {
    if (rules.required && !isRequired(value)) {
        return `${fieldName} is required.`;
    }

    if (rules.email && value && !isValidEmail(value)) {
        return 'Please enter a valid email address.';
    }

    if (rules.minLength && value && value.length < rules.minLength) {
        return `${fieldName} must be at least ${rules.minLength} characters.`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
        return `${fieldName} must be no more than ${rules.maxLength} characters.`;
    }

    if (rules.match && value !== rules.match.value) {
        return `${fieldName} must match ${rules.match.fieldName}.`;
    }

    return null;
}

/// Validates an entire form object and returns a map of field errors
export function validateForm(fields) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, { value, rules }] of Object.entries(fields)) {
        const error = validateField(fieldName, value, rules);
        if (error) {
            errors[fieldName] = error;
            isValid = false;
        }
    }

    return { isValid, errors };
}
