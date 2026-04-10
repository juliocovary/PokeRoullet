import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const InstitutionalFooter = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-border py-2 z-50">
      <div className="container mx-auto flex justify-center gap-6 text-sm text-muted-foreground">
        <Link to="/about" className="hover:text-primary transition-colors">
          {t('footer.about')}
        </Link>
        <Link to="/privacy" className="hover:text-primary transition-colors">
          {t('footer.privacy')}
        </Link>
        <Link to="/terms" className="hover:text-primary transition-colors">
          {t('footer.terms')}
        </Link>
        <Link to="/contact" className="hover:text-primary transition-colors">
          {t('footer.contact')}
        </Link>
      </div>
    </footer>
  );
};
