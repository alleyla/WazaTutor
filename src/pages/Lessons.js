import React, { useContext } from 'react';
import { AppBar, Toolbar } from '@material-ui/core';
import BrandLogoNav from '../components/BrandLogoNav';
import LessonSelectionWrapper from '../components/problem-layout/LessonSelectionWrapper';
import { withRouter } from 'react-router-dom';
import withTranslation from '../util/withTranslation';
import { ThemeContext } from '../config/config';

class Lessons extends React.Component {
    static contextType = ThemeContext;

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{ backgroundColor: "#F6F6F6", paddingBottom: 20 }}>
                {/* Main Navigation Bar */}
                <AppBar position="static">
                    <Toolbar>
                        <BrandLogoNav />
                    </Toolbar>
                </AppBar>

                {/* Lesson Selection Component */}
                <LessonSelectionWrapper
                    selectLesson={(lesson) => {
                        // Navigate to the lesson when selected
                        this. props.history.push(`/lessons/${lesson.id}`);
                    }}
                    selectCourse={(course) => {
                        // Handle course selection if needed
                        console.log('Course selected:', course);
                    }}
                    history={this.props.history}
                    removeProgress={() => {
                        // This functionality might not be needed on the lessons page
                        // but we can pass a no-op or handle it differently
                        console.log('Remove progress called');
                    }}
                />
            </div>
        );
    }
}

export default withRouter(withTranslation(Lessons));