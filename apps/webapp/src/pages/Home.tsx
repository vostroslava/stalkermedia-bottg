import { useState, useEffect } from 'react';
import { getTests } from '../lib/api';

interface Test {
    code: string;
    title: string;
    description: string;
    questionsCount: number;
}

interface HomeProps {
    onSelectTest: (testCode: string) => void;
}

function Home({ onSelectTest }: HomeProps) {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTests() {
            try {
                const response = await getTests();
                setTests(response.tests);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось загрузить тесты');
            } finally {
                setLoading(false);
            }
        }
        loadTests();
    }, []);

    if (loading) {
        return (
            <div className="loader">
                <div className="loader__spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <div className="error__icon">⚠️</div>
                <p className="error__text">{error}</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <>
            <header className="header">
                <h1 className="header__logo">Сталкер Медиа</h1>
                <p className="header__subtitle">
                    Пройдите тесты по нашим методологиям и узнайте больше о себе
                </p>
            </header>

            <main>
                {tests.map((test) => (
                    <article key={test.code} className="card">
                        <h2 className="card__title">{test.title}</h2>
                        <p className="card__description">{test.description}</p>
                        <p className="card__meta">📝 {test.questionsCount} вопросов</p>
                        <button
                            className="btn btn--primary"
                            onClick={() => onSelectTest(test.code)}
                        >
                            Пройти тест
                        </button>
                    </article>
                ))}
            </main>
        </>
    );
}

export default Home;
