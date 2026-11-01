import React from 'react';

type Props = {
  FallbackComponent: React.ComponentType<{ error: Error; resetError: () => void }>;
  children: React.ReactNode;
};

type State = { error: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  resetError = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const FallbackComponent = this.props.FallbackComponent;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }
    return this.props.children;
  }
}
