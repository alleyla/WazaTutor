import React from "react";
import Spacer from "@components/Spacer";
import { useStyles } from "./Posts";
import { HELP_DOCUMENT, SITE_NAME } from "../../config/config";

const VPAT_LINK = `${process.env.PUBLIC_URL}/static/documents/OATutor_Sec508_WCAG.pdf`

const About = () => {
    const classes = useStyles()
    const currentYear = new Date().getFullYear();

    return <>
        <h2>
            About {SITE_NAME}
        </h2>
        Open Adaptive Tutor ({SITE_NAME}) is an innovative hybrid tutoring system designed to help students master foundational pre-algebra skills, with a specific focus on fractions. By combining the personalized, adaptive feedback of an AI digital tutor with targeted paper-based practice, WazaTutor provides a balanced learning experience optimized for in-home use.


        <h3>Built on OATutor and OpenStax</h3>

        <p>WazaTutor is built upon the foundation of OATutor, an open-source adaptive tutoring system developed by the University of California, Berkeley. OATutor utilizes Intelligent Tutoring System principles and Bayesian Knowledge Tracing to estimate skill mastery and personalize learning pathways.</p>

        <p>OATutor code is licensed under a MIT Open Source License, with its adaptive learning content made available under a CC BY 4.0 license.</p>

        <p>© {currentYear}, CAHL Research Lab, UC Berkley School of Education.</p>
        <ul>
            <li>Visit <a href="https://www.oatutor.io/" target={"_blank"} rel={"noreferrer"}>https://www.oatutor.io/</a> to explore more about OATutor, our mission, and how it can benefit you.</li>
            <li>Read their <a href="https://dl.acm.org/doi/10.1145/3544548.3581574" target={"_blank"} rel={"noreferrer"}>research paper</a> to learn more about the scientific foundation and methodology behind OATutor.</li>
        </ul>

        The content contains problems curated from OpenStax with hints and scaffolds authored by the OATutor Project.
        <p>All content used in this app is made available by OpenStax under the Creative Commons Attribution 4.0 International (CC BY 4.0) license.</p>
        Visit <a href="https://openstax.org/" target={"_blank"} rel={"noreferrer"}>https://openstax.org/</a> to explore more about OpenStax Project.

        <h3>Accessibility Standards</h3>

        <p>
            {SITE_NAME} strives to ensure an easy and accessible experience for all users, regardless of disabilities.
            The site, {SITE_NAME}, is built with the most up-to-date HTML5 and CSS3 standards.
        </p>

        <h3>Contact Us</h3>
        We value your feedback and are here to support your learning journey. If you have questions, suggestions, or need assistance, please reach out to us.

        <p>Email: <a href="mailto:lalieva3@gatech.edu">lalieva3@gatech.edu</a></p>

        <Spacer height={24 * 1}/>

        <sub>
            <p>Copyright © 2025 WazaTutor. All Rights Reserved. Portions of this software are Copyright © 2025  CAHL Research Lab, UC Berkley School of Education (OATutor).</p>
        </sub>
    </>
}

export default About
