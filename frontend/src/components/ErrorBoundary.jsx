import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-boundary'>
          <div className='error-boundary__icon'>⚠</div>
          <h3 className='error-boundary__title'>Something went wrong</h3>
          <p className='error-boundary__message'>
            {this.props.fallbackMessage ??
              "An unexpected error occurred while loading this section."}
          </p>
          <button className='btn btn--ghost' onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
