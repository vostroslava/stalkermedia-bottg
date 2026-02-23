import { useState } from 'react';
import Home from './pages/Home';
import Subscribe from './pages/Subscribe';
import Test from './pages/Test';
import Result from './pages/Result';
import type { TestMatrix, CalculatedResult } from '@stalker/shared';

type Screen = 'home' | 'subscribe' | 'test' | 'result';

interface AppState {
    screen: Screen;
    selectedTest: string | null;
    testMatrix: TestMatrix | null;
    result: CalculatedResult | null;
}

function App() {
    const [state, setState] = useState<AppState>({
        screen: 'home',
        selectedTest: null,
        testMatrix: null,
        result: null,
    });

    const handleSelectTest = (testCode: string) => {
        setState((prev) => ({
            ...prev,
            selectedTest: testCode,
            screen: 'subscribe',
        }));
    };

    const handleSubscriptionVerified = () => {
        setState((prev) => ({
            ...prev,
            screen: 'test',
        }));
    };

    const handleSetMatrix = (matrix: TestMatrix) => {
        setState((prev) => ({
            ...prev,
            testMatrix: matrix,
        }));
    };

    const handleTestComplete = (result: CalculatedResult) => {
        setState((prev) => ({
            ...prev,
            result,
            screen: 'result',
        }));
    };

    const handleBackToHome = () => {
        setState({
            screen: 'home',
            selectedTest: null,
            testMatrix: null,
            result: null,
        });
    };

    return (
        <div className="app">
            {state.screen === 'home' && (
                <Home onSelectTest={handleSelectTest} />
            )}

            {state.screen === 'subscribe' && state.selectedTest && (
                <Subscribe
                    testCode={state.selectedTest}
                    onVerified={handleSubscriptionVerified}
                    onBack={handleBackToHome}
                    onSetMatrix={handleSetMatrix}
                />
            )}

            {state.screen === 'test' && state.selectedTest && state.testMatrix && (
                <Test
                    testCode={state.selectedTest}
                    matrix={state.testMatrix}
                    onComplete={handleTestComplete}
                    onBack={handleBackToHome}
                />
            )}

            {state.screen === 'result' && state.result && state.selectedTest && (
                <Result
                    testCode={state.selectedTest}
                    result={state.result}
                    onBack={handleBackToHome}
                />
            )}
        </div>
    );
}

export default App;
