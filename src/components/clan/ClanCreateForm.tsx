import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { CLAN_EMBLEMS, ClanEmblem } from './ClanEmblems';
import { Shield, Loader2, Coins } from 'lucide-react';
import pokecoinIcon from '@/assets/pokecoin.png';

interface ClanCreateFormProps {
  onSuccess: () => void;
  createClan: (name: string, description: string, emblem: string, minLevel: number, entryType: string) => Promise<boolean>;
}

export const ClanCreateForm = ({ onSuccess, createClan }: ClanCreateFormProps) => {
  const { t } = useTranslation(['clan']);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emblem, setEmblem] = useState('psyduck');
  const [minLevel, setMinLevel] = useState(5);
  const [entryType, setEntryType] = useState('open');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.length < 3 || name.length > 20) return;
    
    setCreating(true);
    const success = await createClan(name, description, emblem, minLevel, entryType);
    setCreating(false);
    
    if (success) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 mb-3 shadow-md">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{t('create.title')}</h3>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-700 font-semibold">
          <img src={pokecoinIcon} alt="Pokecoin" className="w-5 h-5" />
          <span>{t('create.cost', 'Custo: 2.000 Pokecoins')}</span>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900 font-semibold">{t('create.name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('create.namePlaceholder')}
          maxLength={20}
          minLength={3}
          required
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20 shadow-sm hover:border-gray-400 transition-colors rounded-lg"
        />
        <p className={`text-xs ${name.length > 17 ? 'text-orange-600' : 'text-gray-500'}`}>
          {name.length}/20
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-900 font-semibold">{t('create.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('create.descriptionPlaceholder')}
          maxLength={200}
          rows={3}
          className="bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400/20 resize-none shadow-sm hover:border-gray-400 transition-colors rounded-lg"
        />
        <p className={`text-xs ${description.length > 180 ? 'text-orange-600' : 'text-gray-500'}`}>
          {description.length}/200
        </p>
      </div>

      {/* Emblem Selection */}
      <div className="space-y-3">
        <Label className="text-gray-900 font-semibold">{t('create.emblem')}</Label>
        <div className="grid grid-cols-5 gap-3">
          {CLAN_EMBLEMS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEmblem(e.id)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 shadow-sm hover:shadow-md ${
                emblem === e.id 
                  ? 'border-gray-900 bg-gray-100 scale-105' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <ClanEmblem emblemId={e.id} size="sm" />
              <span className="text-[9px] text-gray-600">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entry Type */}
      <div className="space-y-2">
        <Label className="text-gray-900">{t('create.entryType')}</Label>
        <Select value={entryType} onValueChange={setEntryType}>
          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-300">
            <SelectItem value="open">{t('create.entryTypes.open')}</SelectItem>
            <SelectItem value="approval">{t('create.entryTypes.approval')}</SelectItem>
            <SelectItem value="invite_only">{t('create.entryTypes.invite_only')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Min Level */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-gray-900">{t('create.minLevel')}</Label>
          <span className="text-lg font-bold text-gray-900">
            {minLevel}
          </span>
        </div>
        <Slider
          value={[minLevel]}
          onValueChange={(v) => setMinLevel(v[0])}
          min={5}
          max={50}
          step={1}
          className="[&_[role=slider]]:bg-gray-900"
        />
        <p className="text-xs text-gray-600 text-center">
          {t('create.levelRequirement', 'Nível mínimo para entrar no clã')}
        </p>
      </div>

      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full bg-gray-900 hover:bg-gray-800 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 py-6 text-base font-semibold rounded-lg hover:scale-105" 
        disabled={creating || name.length < 3}
      >
        {creating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('create.creating')}
          </>
        ) : (
          <>
            <img src={pokecoinIcon} alt="" className="w-4 h-4 mr-2" />
            {t('create.createButton')} (2.000)
          </>
        )}
      </Button>
    </form>
  );
};
