import "../../styles/app-loader.css";

type AppLoaderProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
};

export function AppLoader({ visible, title, subtitle }: AppLoaderProps) {
  if (!visible) return null;

  return (
    <div
      className="app-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="app-loader__backdrop" />

      <div className="app-loader__content">
        <div className="gusano">
          <span className="gusano__dot gusano__dot--1" />
          <span className="gusano__dot gusano__dot--2" />
          <span className="gusano__dot gusano__dot--3" />
          <span className="gusano__dot gusano__dot--4" />
          <span className="gusano__dot gusano__dot--5" />
          <span className="gusano__dot gusano__dot--6" />
          <span className="gusano__dot gusano__dot--7" />
          <span className="gusano__dot gusano__dot--8" />
        </div>

        <div className="app-loader__text">
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
