import React from 'react';
import { Container, Typography, Box, Link, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { SITE_NAME } from '../../config/config';

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.default,
        minHeight: '100vh',
        paddingTop: theme. spacing(4),
        paddingBottom: theme.spacing(4),
    },
    container: {
        maxWidth: 800,
    },
    title: {
        fontWeight: 700,
        marginBottom: theme. spacing(2),
        color: theme.palette.primary.main,
    },
    section: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(3),
    },
    sectionTitle: {
        fontWeight: 600,
        marginBottom: theme.spacing(2),
        color: theme.palette. text.primary,
    },
    paragraph: {
        marginBottom: theme.spacing(2),
        lineHeight: 1.7,
        color: theme.palette.text. secondary,
    },
    list: {
        marginLeft: theme.spacing(3),
        marginBottom: theme.spacing(2),
        '& li': {
            marginBottom: theme.spacing(1),
            lineHeight: 1.7,
        },
    },
    contactBox: {
        backgroundColor: theme.palette.grey[100],
        padding: theme.spacing(3),
        borderRadius: theme.shape.borderRadius,
        marginTop: theme.spacing(3),
    },
    lastUpdated: {
        fontStyle: 'italic',
        color: theme.palette.text. secondary,
        marginTop: theme.spacing(2),
    },
}));

const TermsAndConditions = () => {
    const classes = useStyles();
    const currentYear = new Date().getFullYear();

    return (
        <Box className={classes.root}>
            <Container className={classes.container}>
                <Typography variant="h3" className={classes.title}>
                    Terms and Conditions
                </Typography>

                <Typography variant="body2" className={classes.  lastUpdated}>
                    Last Updated: December 7, 2025
                </Typography>

                <Divider style={{ margin: '24px 0' }} />

                {/* Introduction */}
                <Box className={classes.section}>
                    <Typography variant="body1" className={classes.paragraph}>
                        Welcome to {SITE_NAME}.  By accessing or using our platform, you agree to be bound by these Terms and Conditions.
                        Please read them carefully before using our services.
                    </Typography>
                </Box>

                {/* Use of Service */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        1. Use of Service
                    </Typography>
                    <Typography variant="body1" className={classes. paragraph}>
                        {SITE_NAME} provides an educational platform for learning mathematics.  By using our service, you agree to:
                    </Typography>
                    <ul className={classes.list}>
                        <li>Use the platform for educational purposes only</li>
                        <li>Provide accurate information when creating an account</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Not attempt to disrupt or interfere with the platform's functionality</li>
                        <li>Not use the platform for any unlawful purposes</li>
                    </ul>
                </Box>

                {/* User Accounts */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.  sectionTitle}>
                        2. User Accounts
                    </Typography>
                    <Typography variant="body1" className={classes. paragraph}>
                        You may create an account to track your progress and access personalized features. You are responsible for:
                    </Typography>
                    <ul className={classes.list}>
                        <li>Maintaining the confidentiality of your account information</li>
                        <li>All activities that occur under your account</li>
                        <li>Notifying us immediately of any unauthorized use of your account</li>
                    </ul>
                </Box>

                {/* Intellectual Property */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        3. Intellectual Property
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        All content on {SITE_NAME}, including problems, lessons, and educational materials, is provided for educational use.
                        Some content is adapted from open educational resources (OER) and is subject to their respective licenses.
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        You may not reproduce, distribute, or create derivative works from our content without explicit permission,
                        except as allowed under applicable OER licenses.
                    </Typography>
                </Box>

                {/* Privacy and Data Collection */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        4. Privacy and Data Collection
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        We are committed to protecting your privacy. Here's what you should know:
                    </Typography>
                    <ul className={classes.list}>
                        <li><strong>Data We Collect:</strong> We collect your email address, learning progress, problem attempts, and worksheet data to provide our services.</li>
                        <li><strong>How We Use Your Data:</strong> Your data is used to track your learning progress, personalize your experience, and improve our educational platform.</li>
                        <li><strong>Data Security:</strong> We use industry-standard security measures including password hashing and secure authentication tokens.</li>
                        <li><strong>Data Sharing:</strong> We do not sell or share your personal information with third parties for marketing purposes.</li>
                        <li><strong>Your Rights:</strong> You can request access to, correction of, or deletion of your personal data by contacting us.</li>
                    </ul>
                </Box>

                {/* Disclaimer */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        5. Disclaimer
                    </Typography>
                    <Typography variant="body1" className={classes. paragraph}>
                        {SITE_NAME} is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that:
                    </Typography>
                    <ul className={classes.list}>
                        <li>The service will be uninterrupted or error-free</li>
                        <li>The content is complete, accurate, or up-to-date</li>
                        <li>The platform will meet your specific educational needs</li>
                    </ul>
                </Box>

                {/* Limitation of Liability */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        6.  Limitation of Liability
                    </Typography>
                    <Typography variant="body1" className={classes. paragraph}>
                        To the fullest extent permitted by law, {SITE_NAME} shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages resulting from your use of or inability to use the service.
                    </Typography>
                </Box>

                {/* Changes to Terms */}
                <Box className={classes.section}>
                    <Typography variant="h5" className={classes.sectionTitle}>
                        7. Changes to Terms
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        We reserve the right to modify these Terms and Conditions at any time.  We will notify users of significant changes
                        by posting a notice on the platform. Your continued use of the service after changes constitutes acceptance of the new terms.
                    </Typography>
                </Box>

                {/* Contact Information */}
                <Box className={classes.contactBox}>
                    <Typography variant="h5" className={classes. sectionTitle}>
                        Contact Us
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        If you have any questions about these Terms and Conditions, privacy concerns, or need to exercise your data rights,
                        please contact us:
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        <strong>Email:</strong>{' '}
                        <Link href="mailto:lalieva3@gatech.edu" color="primary">
                            mailto:lalieva3@gatech.edu
                        </Link>
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph}>
                        <strong>For Privacy Requests:</strong>{' '}
                        <Link href="mailto:lalieva3@gatech.edu" color="primary">
                            mailto:lalieva3@gatech.edu
                        </Link>
                    </Typography>
                    <Typography variant="body1" className={classes.paragraph} style={{ marginBottom: 0 }}>
                        We aim to respond to all inquiries within 5 business days.
                    </Typography>
                </Box>

                <Divider style={{ margin: '32px 0' }} />

                <Typography variant="body2" className={classes.paragraph} style={{ textAlign: 'center' }}>
                    © {currentYear} {SITE_NAME}. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};

export default TermsAndConditions;