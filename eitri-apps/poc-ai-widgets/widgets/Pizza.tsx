import React, { useEffect } from 'react'

export default function Pizza() {

    useEffect(() => {
        console.log('Pizza widget mounted');

        if (!window.openai) {
            console.warn('OpenAI not found');
            return;
        }

        console.log(window.openai)

        window.openai?.sendFollowupMessage({
            prompt: "Draft a tasting itinerary for the pizzerias I favorited.",
        })?.then((response) => {
            console.log(response);
        });
    }, [window.openai]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FF9000'
        }}>
            <h1>Pizza</h1>
            <p>This is a pizza widget</p>

            <span>How many slices?</span>
        </div>
    );
}