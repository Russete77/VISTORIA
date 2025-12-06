-- Migration 013: Regional Costs Base
-- Created: 2025-12-02
-- Description: Comprehensive repair cost database by region and service type

-- ================================================
-- REGIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(2),
  type VARCHAR(20) CHECK (type IN ('capital', 'metropolitan', 'interior', 'region')),
  cost_multiplier DECIMAL(4,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SERVICE CATEGORIES TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- REPAIR SERVICES TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS repair_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  unit VARCHAR(20) NOT NULL, -- m², m, un, h, diária
  unit_label VARCHAR(50) NOT NULL, -- "por m²", "por metro", "por unidade"

  -- Base prices (reference: São Paulo Capital)
  base_price_min DECIMAL(10,2) NOT NULL,
  base_price_max DECIMAL(10,2) NOT NULL,
  base_price_avg DECIMAL(10,2) GENERATED ALWAYS AS ((base_price_min + base_price_max) / 2) STORED,

  -- Metadata
  includes_material BOOLEAN DEFAULT TRUE,
  includes_labor BOOLEAN DEFAULT TRUE,
  estimated_hours DECIMAL(5,2),
  difficulty VARCHAR(20) CHECK (difficulty IN ('simple', 'medium', 'complex', 'specialist')),

  -- Search
  keywords TEXT[], -- para busca
  severity_tags TEXT[], -- low, medium, high, urgent

  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- REGIONAL COST ADJUSTMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS regional_cost_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
  service_id UUID REFERENCES repair_services(id) ON DELETE CASCADE,

  -- Multiplier applied to base price
  cost_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,

  -- Override specific prices (optional)
  price_min_override DECIMAL(10,2),
  price_max_override DECIMAL(10,2),

  -- Validity
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either category-wide or service-specific adjustment
  CONSTRAINT check_adjustment_target CHECK (
    (category_id IS NOT NULL AND service_id IS NULL) OR
    (category_id IS NULL AND service_id IS NOT NULL) OR
    (category_id IS NULL AND service_id IS NULL) -- region-wide
  )
);

-- ================================================
-- COST ESTIMATION HISTORY (for analytics)
-- ================================================

CREATE TABLE IF NOT EXISTS cost_estimations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  photo_id UUID REFERENCES inspection_photos(id) ON DELETE SET NULL,
  problem_id UUID REFERENCES photo_problems(id) ON DELETE SET NULL,

  region_id UUID REFERENCES regions(id),
  service_id UUID REFERENCES repair_services(id),

  quantity DECIMAL(10,2) DEFAULT 1,
  estimated_min DECIMAL(10,2) NOT NULL,
  estimated_max DECIMAL(10,2) NOT NULL,
  estimated_avg DECIMAL(10,2) NOT NULL,

  -- User feedback
  actual_cost DECIMAL(10,2),
  feedback_accuracy VARCHAR(20) CHECK (feedback_accuracy IN ('accurate', 'low', 'high', 'way_off')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_repair_services_category ON repair_services(category_id);
CREATE INDEX idx_repair_services_keywords ON repair_services USING GIN(keywords);
CREATE INDEX idx_repair_services_severity ON repair_services USING GIN(severity_tags);
CREATE INDEX idx_regional_adjustments_region ON regional_cost_adjustments(region_id);
CREATE INDEX idx_regional_adjustments_category ON regional_cost_adjustments(category_id);
CREATE INDEX idx_regional_adjustments_service ON regional_cost_adjustments(service_id);
CREATE INDEX idx_cost_estimations_user ON cost_estimations(user_id);
CREATE INDEX idx_cost_estimations_inspection ON cost_estimations(inspection_id);

-- ================================================
-- INSERT REGIONS
-- ================================================

INSERT INTO regions (code, name, state, type, cost_multiplier) VALUES
-- São Paulo
('sp_capital', 'São Paulo Capital', 'SP', 'capital', 1.00),
('sp_metro', 'Grande São Paulo', 'SP', 'metropolitan', 0.95),
('sp_litoral', 'Litoral Paulista', 'SP', 'region', 0.90),
('sp_interior', 'Interior de São Paulo', 'SP', 'interior', 0.85),
('campinas', 'Campinas e Região', 'SP', 'metropolitan', 0.92),
('ribeirao', 'Ribeirão Preto e Região', 'SP', 'interior', 0.88),

-- Rio de Janeiro
('rj_capital', 'Rio de Janeiro Capital', 'RJ', 'capital', 0.95),
('rj_metro', 'Grande Rio', 'RJ', 'metropolitan', 0.88),
('rj_interior', 'Interior do Rio', 'RJ', 'interior', 0.80),

-- Minas Gerais
('bh_capital', 'Belo Horizonte', 'MG', 'capital', 0.85),
('mg_metro', 'Grande BH', 'MG', 'metropolitan', 0.80),
('mg_interior', 'Interior de Minas', 'MG', 'interior', 0.75),

-- Sul
('poa_capital', 'Porto Alegre', 'RS', 'capital', 0.88),
('rs_interior', 'Interior do RS', 'RS', 'interior', 0.80),
('cwb_capital', 'Curitiba', 'PR', 'capital', 0.90),
('pr_interior', 'Interior do PR', 'PR', 'interior', 0.82),
('fpolis_capital', 'Florianópolis', 'SC', 'capital', 0.92),
('sc_interior', 'Interior de SC', 'SC', 'interior', 0.82),

-- Centro-Oeste
('bsb_capital', 'Brasília', 'DF', 'capital', 0.95),
('goiania', 'Goiânia', 'GO', 'capital', 0.82),
('go_interior', 'Interior de Goiás', 'GO', 'interior', 0.75),
('cuiaba', 'Cuiabá', 'MT', 'capital', 0.80),
('campo_grande', 'Campo Grande', 'MS', 'capital', 0.78),

-- Nordeste
('salvador', 'Salvador', 'BA', 'capital', 0.78),
('ba_interior', 'Interior da Bahia', 'BA', 'interior', 0.68),
('recife', 'Recife', 'PE', 'capital', 0.75),
('pe_interior', 'Interior de PE', 'PE', 'interior', 0.65),
('fortaleza', 'Fortaleza', 'CE', 'capital', 0.75),
('ce_interior', 'Interior do CE', 'CE', 'interior', 0.65),
('natal', 'Natal', 'RN', 'capital', 0.72),
('joao_pessoa', 'João Pessoa', 'PB', 'capital', 0.70),
('maceio', 'Maceió', 'AL', 'capital', 0.70),
('aracaju', 'Aracaju', 'SE', 'capital', 0.70),
('teresina', 'Teresina', 'PI', 'capital', 0.68),
('sao_luis', 'São Luís', 'MA', 'capital', 0.70),

-- Norte
('manaus', 'Manaus', 'AM', 'capital', 0.85),
('belem', 'Belém', 'PA', 'capital', 0.78),
('pa_interior', 'Interior do Pará', 'PA', 'interior', 0.70),
('palmas', 'Palmas', 'TO', 'capital', 0.75),
('porto_velho', 'Porto Velho', 'RO', 'capital', 0.80),
('rio_branco', 'Rio Branco', 'AC', 'capital', 0.82),
('boa_vista', 'Boa Vista', 'RR', 'capital', 0.85),
('macapa', 'Macapá', 'AP', 'capital', 0.85);

-- ================================================
-- INSERT SERVICE CATEGORIES
-- ================================================

INSERT INTO service_categories (code, name, description, icon, display_order) VALUES
('pintura', 'Pintura', 'Serviços de pintura interna e externa', 'paint-bucket', 1),
('hidraulica', 'Hidráulica', 'Instalações e reparos hidráulicos', 'droplet', 2),
('eletrica', 'Elétrica', 'Instalações e reparos elétricos', 'zap', 3),
('piso_revestimento', 'Pisos e Revestimentos', 'Instalação e reparo de pisos e azulejos', 'grid', 4),
('gesso_forro', 'Gesso e Forro', 'Instalação e reparo de forros e divisórias', 'layers', 5),
('marcenaria', 'Marcenaria e Portas', 'Reparo e instalação de portas e móveis', 'door-open', 6),
('vidracaria', 'Vidraçaria', 'Instalação e troca de vidros', 'square', 7),
('serralheria', 'Serralheria', 'Serviços em metal, grades e portões', 'wrench', 8),
('impermeabilizacao', 'Impermeabilização', 'Tratamento contra infiltrações', 'shield', 9),
('ar_condicionado', 'Ar Condicionado', 'Instalação, manutenção e reparo', 'wind', 10),
('limpeza', 'Limpeza Especializada', 'Limpeza profissional e pós-obra', 'sparkles', 11),
('alvenaria', 'Alvenaria', 'Reparos em paredes e estruturas', 'brick-wall', 12),
('telhado', 'Telhado e Cobertura', 'Reparos e manutenção de telhados', 'home', 13),
('esquadrias', 'Esquadrias', 'Janelas, portas de alumínio e PVC', 'frame', 14),
('jardim', 'Jardinagem', 'Manutenção de áreas verdes', 'flower', 15),
('dedetizacao', 'Dedetização', 'Controle de pragas', 'bug', 16),
('loucas_metais', 'Louças e Metais', 'Instalação e troca de louças sanitárias', 'bath', 17),
('fechadura', 'Fechaduras e Fechos', 'Chaveiro e reparos em fechaduras', 'key', 18);

-- ================================================
-- INSERT REPAIR SERVICES - PINTURA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_parede_simples', 'Pintura de Parede (1 demão)', 'Pintura simples com uma demão de tinta látex', 'm²', 'por m²', 18.00, 28.00, true, true, 'simple', ARRAY['pintura', 'parede', 'látex', 'demão'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_parede_completa', 'Pintura de Parede Completa', 'Pintura com massa corrida, lixamento e 2 demãos', 'm²', 'por m²', 35.00, 55.00, true, true, 'medium', ARRAY['pintura', 'parede', 'massa', 'corrida', 'completa'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_teto', 'Pintura de Teto', 'Pintura de teto com tinta látex', 'm²', 'por m²', 25.00, 40.00, true, true, 'medium', ARRAY['pintura', 'teto', 'forro'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_porta_madeira', 'Pintura de Porta de Madeira', 'Lixamento, massa e pintura esmalte', 'un', 'por unidade', 180.00, 320.00, true, true, 'medium', ARRAY['pintura', 'porta', 'madeira', 'esmalte'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_janela_madeira', 'Pintura de Janela de Madeira', 'Lixamento e pintura esmalte', 'un', 'por unidade', 150.00, 280.00, true, true, 'medium', ARRAY['pintura', 'janela', 'madeira'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_grade_portao', 'Pintura de Grade/Portão', 'Lixamento, zarcão e esmalte sintético', 'm²', 'por m²', 45.00, 75.00, true, true, 'medium', ARRAY['pintura', 'grade', 'portão', 'metal'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_fachada', 'Pintura de Fachada', 'Pintura externa com tinta acrílica', 'm²', 'por m²', 40.00, 65.00, true, true, 'complex', ARRAY['pintura', 'fachada', 'externa', 'acrílica'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'remocao_textura', 'Remoção de Textura/Grafiato', 'Raspagem e regularização da superfície', 'm²', 'por m²', 25.00, 45.00, false, true, 'complex', ARRAY['textura', 'grafiato', 'remoção'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'aplicacao_textura', 'Aplicação de Textura/Grafiato', 'Aplicação de textura decorativa', 'm²', 'por m²', 35.00, 60.00, true, true, 'medium', ARRAY['textura', 'grafiato', 'aplicação'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'pintura'), 'pintura_epoxi', 'Pintura Epóxi', 'Pintura epóxi para pisos e áreas úmidas', 'm²', 'por m²', 65.00, 110.00, true, true, 'specialist', ARRAY['pintura', 'epóxi', 'piso', 'garagem'], ARRAY['medium', 'high']);

-- ================================================
-- INSERT REPAIR SERVICES - HIDRÁULICA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_torneira', 'Troca de Torneira', 'Substituição de torneira de pia ou lavatório', 'un', 'por unidade', 80.00, 150.00, false, true, 'simple', ARRAY['torneira', 'troca', 'pia', 'lavatório'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_sifao', 'Troca de Sifão', 'Substituição de sifão de pia ou lavatório', 'un', 'por unidade', 60.00, 100.00, true, true, 'simple', ARRAY['sifão', 'troca', 'pia'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'desentupimento_simples', 'Desentupimento Simples', 'Desentupimento de pia, ralo ou lavatório', 'un', 'por serviço', 80.00, 150.00, false, true, 'simple', ARRAY['desentupimento', 'pia', 'ralo', 'entupido'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'desentupimento_vaso', 'Desentupimento de Vaso Sanitário', 'Desentupimento de vaso sanitário', 'un', 'por serviço', 100.00, 200.00, false, true, 'simple', ARRAY['desentupimento', 'vaso', 'sanitário', 'entupido'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'desentupimento_esgoto', 'Desentupimento de Esgoto', 'Desentupimento de rede de esgoto com máquina', 'un', 'por serviço', 200.00, 450.00, false, true, 'complex', ARRAY['desentupimento', 'esgoto', 'máquina'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_engate', 'Troca de Engate Flexível', 'Substituição de engate de água', 'un', 'por unidade', 40.00, 80.00, true, true, 'simple', ARRAY['engate', 'flexível', 'troca'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'reparo_vazamento', 'Reparo de Vazamento', 'Localização e reparo de vazamento aparente', 'un', 'por serviço', 120.00, 280.00, true, true, 'medium', ARRAY['vazamento', 'reparo', 'água'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_registro', 'Troca de Registro', 'Substituição de registro de gaveta ou pressão', 'un', 'por unidade', 100.00, 200.00, true, true, 'medium', ARRAY['registro', 'troca', 'gaveta', 'pressão'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'instalacao_chuveiro', 'Instalação de Chuveiro', 'Instalação de chuveiro elétrico', 'un', 'por unidade', 80.00, 150.00, false, true, 'medium', ARRAY['chuveiro', 'instalação', 'elétrico'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_valvula_descarga', 'Troca de Válvula de Descarga', 'Substituição de válvula de descarga', 'un', 'por unidade', 150.00, 300.00, true, true, 'medium', ARRAY['válvula', 'descarga', 'troca'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'troca_caixa_descarga', 'Troca de Caixa Acoplada', 'Substituição de caixa acoplada completa', 'un', 'por unidade', 200.00, 400.00, true, true, 'medium', ARRAY['caixa', 'acoplada', 'descarga', 'troca'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'reparo_caixa_dagua', 'Reparo em Caixa D''água', 'Limpeza e reparo de caixa d''água', 'un', 'por unidade', 180.00, 350.00, true, true, 'medium', ARRAY['caixa', 'água', 'limpeza', 'reparo'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'hidraulica'), 'instalacao_ponto_agua', 'Instalação de Ponto de Água', 'Novo ponto de água fria ou quente', 'un', 'por ponto', 180.00, 350.00, true, true, 'complex', ARRAY['ponto', 'água', 'instalação'], ARRAY['medium']);

-- ================================================
-- INSERT REPAIR SERVICES - ELÉTRICA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'troca_tomada', 'Troca de Tomada', 'Substituição de tomada elétrica', 'un', 'por unidade', 50.00, 90.00, true, true, 'simple', ARRAY['tomada', 'troca', 'elétrica'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'troca_interruptor', 'Troca de Interruptor', 'Substituição de interruptor simples ou paralelo', 'un', 'por unidade', 50.00, 100.00, true, true, 'simple', ARRAY['interruptor', 'troca'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'instalacao_luminaria', 'Instalação de Luminária', 'Instalação de luminária ou plafon', 'un', 'por unidade', 60.00, 120.00, false, true, 'simple', ARRAY['luminária', 'instalação', 'plafon'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'troca_disjuntor', 'Troca de Disjuntor', 'Substituição de disjuntor no quadro', 'un', 'por unidade', 80.00, 150.00, true, true, 'medium', ARRAY['disjuntor', 'troca', 'quadro'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'instalacao_ponto_luz', 'Instalação de Ponto de Luz', 'Novo ponto de iluminação', 'un', 'por ponto', 150.00, 280.00, true, true, 'medium', ARRAY['ponto', 'luz', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'instalacao_ponto_tomada', 'Instalação de Ponto de Tomada', 'Novo ponto de tomada', 'un', 'por ponto', 150.00, 280.00, true, true, 'medium', ARRAY['ponto', 'tomada', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'reparo_curto_circuito', 'Reparo de Curto-Circuito', 'Identificação e reparo de curto-circuito', 'un', 'por serviço', 150.00, 350.00, true, true, 'complex', ARRAY['curto', 'circuito', 'reparo'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'troca_quadro_distribuicao', 'Troca de Quadro de Distribuição', 'Substituição de quadro elétrico completo', 'un', 'por unidade', 400.00, 800.00, true, true, 'specialist', ARRAY['quadro', 'distribuição', 'elétrico', 'troca'], ARRAY['high']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'aterramento', 'Instalação de Aterramento', 'Sistema de aterramento elétrico', 'un', 'por serviço', 350.00, 700.00, true, true, 'specialist', ARRAY['aterramento', 'terra', 'elétrico'], ARRAY['high']),
((SELECT id FROM service_categories WHERE code = 'eletrica'), 'instalacao_ventilador_teto', 'Instalação de Ventilador de Teto', 'Instalação de ventilador de teto', 'un', 'por unidade', 100.00, 180.00, false, true, 'medium', ARRAY['ventilador', 'teto', 'instalação'], ARRAY['low']);

-- ================================================
-- INSERT REPAIR SERVICES - PISOS E REVESTIMENTOS
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_piso_ceramico', 'Troca de Piso Cerâmico', 'Remoção e instalação de piso cerâmico', 'm²', 'por m²', 80.00, 140.00, true, true, 'medium', ARRAY['piso', 'cerâmico', 'cerâmica', 'troca'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_piso_porcelanato', 'Troca de Piso Porcelanato', 'Remoção e instalação de porcelanato', 'm²', 'por m²', 120.00, 200.00, true, true, 'complex', ARRAY['piso', 'porcelanato', 'troca'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'reparo_rejunte', 'Reparo de Rejunte', 'Remoção e reaplicação de rejunte', 'm²', 'por m²', 25.00, 45.00, true, true, 'simple', ARRAY['rejunte', 'reparo', 'piso'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_azulejo', 'Troca de Azulejo', 'Remoção e instalação de azulejos', 'm²', 'por m²', 90.00, 150.00, true, true, 'medium', ARRAY['azulejo', 'troca', 'parede'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_piso_vinilico', 'Instalação de Piso Vinílico', 'Instalação de piso vinílico', 'm²', 'por m²', 70.00, 120.00, true, true, 'medium', ARRAY['piso', 'vinílico', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_piso_laminado', 'Instalação de Piso Laminado', 'Instalação de piso laminado com manta', 'm²', 'por m²', 65.00, 110.00, true, true, 'medium', ARRAY['piso', 'laminado', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'polimento_piso', 'Polimento de Piso', 'Polimento de granito, mármore ou porcelanato', 'm²', 'por m²', 35.00, 60.00, true, true, 'medium', ARRAY['polimento', 'piso', 'mármore', 'granito'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'nivelamento_piso', 'Nivelamento de Piso', 'Regularização de contrapiso', 'm²', 'por m²', 40.00, 70.00, true, true, 'medium', ARRAY['nivelamento', 'piso', 'contrapiso'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_rodape', 'Troca de Rodapé', 'Remoção e instalação de rodapé', 'm', 'por metro', 25.00, 50.00, true, true, 'simple', ARRAY['rodapé', 'troca'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'piso_revestimento'), 'troca_soleira', 'Troca de Soleira', 'Remoção e instalação de soleira', 'un', 'por unidade', 120.00, 220.00, true, true, 'medium', ARRAY['soleira', 'troca', 'porta'], ARRAY['medium']);

-- ================================================
-- INSERT REPAIR SERVICES - GESSO E FORRO
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'reparo_forro_gesso', 'Reparo em Forro de Gesso', 'Reparo localizado em forro de gesso', 'm²', 'por m²', 60.00, 100.00, true, true, 'medium', ARRAY['forro', 'gesso', 'reparo'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'instalacao_forro_gesso', 'Instalação de Forro de Gesso', 'Instalação de forro de gesso liso', 'm²', 'por m²', 75.00, 120.00, true, true, 'medium', ARRAY['forro', 'gesso', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'instalacao_forro_drywall', 'Instalação de Forro Drywall', 'Instalação de forro de drywall', 'm²', 'por m²', 90.00, 140.00, true, true, 'medium', ARRAY['forro', 'drywall', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'instalacao_sanca', 'Instalação de Sanca', 'Instalação de sanca aberta ou fechada', 'm', 'por metro', 80.00, 150.00, true, true, 'complex', ARRAY['sanca', 'gesso', 'instalação'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'reparo_trinca_gesso', 'Reparo de Trinca em Gesso', 'Tratamento de trinca em forro ou parede', 'm', 'por metro', 40.00, 80.00, true, true, 'simple', ARRAY['trinca', 'gesso', 'reparo', 'fissura'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'instalacao_divisoria_drywall', 'Instalação de Divisória Drywall', 'Parede divisória em drywall', 'm²', 'por m²', 110.00, 180.00, true, true, 'complex', ARRAY['divisória', 'drywall', 'parede'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'gesso_forro'), 'reparo_forro_pvc', 'Reparo em Forro PVC', 'Troca de réguas de forro PVC', 'm²', 'por m²', 50.00, 85.00, true, true, 'simple', ARRAY['forro', 'pvc', 'reparo'], ARRAY['low', 'medium']);

-- ================================================
-- INSERT REPAIR SERVICES - MARCENARIA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'ajuste_porta', 'Ajuste de Porta', 'Ajuste de porta que não fecha ou arranha', 'un', 'por unidade', 80.00, 150.00, true, true, 'simple', ARRAY['porta', 'ajuste', 'arranha', 'não fecha'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'troca_porta_interna', 'Troca de Porta Interna', 'Substituição de porta interna com batente', 'un', 'por unidade', 450.00, 850.00, true, true, 'complex', ARRAY['porta', 'interna', 'troca', 'batente'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'troca_batente', 'Troca de Batente', 'Substituição de batente de porta', 'un', 'por unidade', 250.00, 450.00, true, true, 'medium', ARRAY['batente', 'troca', 'porta'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'reparo_gaveta', 'Reparo de Gaveta', 'Conserto de gaveta ou corrediça', 'un', 'por unidade', 80.00, 150.00, true, true, 'simple', ARRAY['gaveta', 'reparo', 'corrediça', 'móvel'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'reparo_armario', 'Reparo de Armário', 'Conserto de armário embutido', 'un', 'por serviço', 150.00, 350.00, true, true, 'medium', ARRAY['armário', 'reparo', 'embutido'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'troca_dobradica', 'Troca de Dobradiça', 'Substituição de dobradiça de porta ou móvel', 'un', 'por unidade', 40.00, 80.00, true, true, 'simple', ARRAY['dobradiça', 'troca', 'porta'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'instalacao_prateleira', 'Instalação de Prateleira', 'Instalação de prateleira com suporte', 'un', 'por unidade', 60.00, 120.00, true, true, 'simple', ARRAY['prateleira', 'instalação'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'marcenaria'), 'reparo_puxador', 'Troca de Puxador', 'Substituição de puxador de porta ou móvel', 'un', 'por unidade', 30.00, 60.00, true, true, 'simple', ARRAY['puxador', 'troca', 'porta', 'móvel'], ARRAY['low']);

-- ================================================
-- INSERT REPAIR SERVICES - VIDRAÇARIA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'vidracaria'), 'troca_vidro_janela', 'Troca de Vidro de Janela', 'Substituição de vidro comum de janela', 'm²', 'por m²', 120.00, 200.00, true, true, 'medium', ARRAY['vidro', 'janela', 'troca', 'quebrado'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'vidracaria'), 'troca_vidro_temperado', 'Troca de Vidro Temperado', 'Substituição de vidro temperado', 'm²', 'por m²', 280.00, 450.00, true, true, 'specialist', ARRAY['vidro', 'temperado', 'troca', 'box'], ARRAY['high']),
((SELECT id FROM service_categories WHERE code = 'vidracaria'), 'troca_espelho', 'Instalação de Espelho', 'Instalação de espelho com fixação', 'm²', 'por m²', 180.00, 300.00, true, true, 'medium', ARRAY['espelho', 'instalação', 'banheiro'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'vidracaria'), 'reparo_box_banheiro', 'Reparo de Box de Banheiro', 'Ajuste ou reparo de box de vidro', 'un', 'por serviço', 150.00, 300.00, true, true, 'medium', ARRAY['box', 'banheiro', 'reparo', 'vidro'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'vidracaria'), 'troca_box_banheiro', 'Troca de Box de Banheiro', 'Substituição completa de box de vidro', 'un', 'por unidade', 800.00, 1500.00, true, true, 'specialist', ARRAY['box', 'banheiro', 'troca', 'vidro'], ARRAY['high']);

-- ================================================
-- INSERT REPAIR SERVICES - SERRALHERIA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'serralheria'), 'reparo_grade', 'Reparo de Grade', 'Solda e reparo de grade de proteção', 'un', 'por serviço', 150.00, 300.00, true, true, 'medium', ARRAY['grade', 'reparo', 'solda', 'proteção'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'serralheria'), 'reparo_portao', 'Reparo de Portão', 'Reparo de portão metálico', 'un', 'por serviço', 200.00, 450.00, true, true, 'medium', ARRAY['portão', 'reparo', 'metal'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'serralheria'), 'instalacao_corrimao', 'Instalação de Corrimão', 'Instalação de corrimão metálico', 'm', 'por metro', 180.00, 320.00, true, true, 'complex', ARRAY['corrimão', 'instalação', 'escada'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'serralheria'), 'reparo_fechadura_portao', 'Reparo de Fechadura de Portão', 'Conserto de fechadura de portão', 'un', 'por unidade', 120.00, 250.00, true, true, 'medium', ARRAY['fechadura', 'portão', 'reparo'], ARRAY['medium', 'high']);

-- ================================================
-- INSERT REPAIR SERVICES - IMPERMEABILIZAÇÃO
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'impermeabilizacao'), 'impermeabilizacao_box', 'Impermeabilização de Box', 'Impermeabilização de área de box de banheiro', 'm²', 'por m²', 80.00, 140.00, true, true, 'specialist', ARRAY['impermeabilização', 'box', 'banheiro', 'infiltração'], ARRAY['high']),
((SELECT id FROM service_categories WHERE code = 'impermeabilizacao'), 'impermeabilizacao_laje', 'Impermeabilização de Laje', 'Impermeabilização de laje exposta', 'm²', 'por m²', 65.00, 110.00, true, true, 'specialist', ARRAY['impermeabilização', 'laje', 'telhado', 'infiltração'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'impermeabilizacao'), 'impermeabilizacao_varanda', 'Impermeabilização de Varanda', 'Impermeabilização de varanda ou sacada', 'm²', 'por m²', 70.00, 120.00, true, true, 'specialist', ARRAY['impermeabilização', 'varanda', 'sacada', 'infiltração'], ARRAY['high']),
((SELECT id FROM service_categories WHERE code = 'impermeabilizacao'), 'tratamento_infiltracao', 'Tratamento de Infiltração', 'Identificação e tratamento de infiltração', 'un', 'por serviço', 250.00, 600.00, true, true, 'specialist', ARRAY['infiltração', 'tratamento', 'umidade', 'mofo'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'impermeabilizacao'), 'aplicacao_hidrofugante', 'Aplicação de Hidrofugante', 'Proteção de fachada com hidrofugante', 'm²', 'por m²', 25.00, 45.00, true, true, 'medium', ARRAY['hidrofugante', 'fachada', 'proteção'], ARRAY['medium']);

-- ================================================
-- INSERT REPAIR SERVICES - AR CONDICIONADO
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'ar_condicionado'), 'instalacao_split', 'Instalação de Split', 'Instalação de ar condicionado split', 'un', 'por unidade', 400.00, 700.00, false, true, 'specialist', ARRAY['ar', 'condicionado', 'split', 'instalação'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'ar_condicionado'), 'manutencao_split', 'Manutenção de Split', 'Limpeza e manutenção preventiva', 'un', 'por unidade', 150.00, 280.00, true, true, 'medium', ARRAY['ar', 'condicionado', 'manutenção', 'limpeza'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'ar_condicionado'), 'carga_gas', 'Carga de Gás', 'Recarga de gás refrigerante', 'un', 'por unidade', 250.00, 450.00, true, true, 'specialist', ARRAY['ar', 'condicionado', 'gás', 'carga'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'ar_condicionado'), 'reparo_ar', 'Reparo de Ar Condicionado', 'Diagnóstico e reparo de defeitos', 'un', 'por serviço', 200.00, 500.00, true, true, 'specialist', ARRAY['ar', 'condicionado', 'reparo', 'defeito'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'ar_condicionado'), 'higienizacao_ar', 'Higienização de Ar Condicionado', 'Limpeza profunda e higienização', 'un', 'por unidade', 180.00, 320.00, true, true, 'medium', ARRAY['ar', 'condicionado', 'higienização', 'limpeza'], ARRAY['low', 'medium']);

-- ================================================
-- INSERT REPAIR SERVICES - LIMPEZA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'limpeza'), 'limpeza_pos_obra', 'Limpeza Pós-Obra', 'Limpeza completa após reforma', 'm²', 'por m²', 15.00, 30.00, true, true, 'medium', ARRAY['limpeza', 'pós', 'obra', 'reforma'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'limpeza'), 'limpeza_vidros', 'Limpeza de Vidros', 'Limpeza de vidros e esquadrias', 'm²', 'por m²', 8.00, 15.00, true, true, 'simple', ARRAY['limpeza', 'vidros', 'janelas'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'limpeza'), 'limpeza_caixa_gordura', 'Limpeza de Caixa de Gordura', 'Limpeza e desentupimento de caixa de gordura', 'un', 'por serviço', 150.00, 300.00, true, true, 'medium', ARRAY['limpeza', 'caixa', 'gordura', 'desentupimento'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'limpeza'), 'lavagem_fachada', 'Lavagem de Fachada', 'Lavagem de fachada com hidrojato', 'm²', 'por m²', 12.00, 25.00, true, true, 'complex', ARRAY['lavagem', 'fachada', 'hidrojato'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'limpeza'), 'tratamento_mofo', 'Tratamento de Mofo', 'Remoção e tratamento de mofo', 'm²', 'por m²', 35.00, 65.00, true, true, 'medium', ARRAY['mofo', 'tratamento', 'bolor', 'fungo'], ARRAY['medium', 'high']);

-- ================================================
-- INSERT REPAIR SERVICES - LOUÇAS E METAIS
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'troca_vaso_sanitario', 'Troca de Vaso Sanitário', 'Substituição de vaso sanitário', 'un', 'por unidade', 200.00, 400.00, false, true, 'medium', ARRAY['vaso', 'sanitário', 'troca', 'banheiro'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'troca_lavatorio', 'Troca de Lavatório', 'Substituição de cuba ou lavatório', 'un', 'por unidade', 180.00, 350.00, false, true, 'medium', ARRAY['lavatório', 'cuba', 'troca', 'pia'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'troca_tanque', 'Troca de Tanque', 'Substituição de tanque de lavar roupas', 'un', 'por unidade', 200.00, 380.00, false, true, 'medium', ARRAY['tanque', 'troca', 'lavanderia'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'troca_pia_cozinha', 'Troca de Pia de Cozinha', 'Substituição de pia de cozinha', 'un', 'por unidade', 250.00, 500.00, false, true, 'medium', ARRAY['pia', 'cozinha', 'troca', 'cuba'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'instalacao_ducha_higienica', 'Instalação de Ducha Higiênica', 'Instalação de ducha higiênica com registro', 'un', 'por unidade', 150.00, 280.00, true, true, 'medium', ARRAY['ducha', 'higiênica', 'instalação'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'loucas_metais'), 'troca_assento_vaso', 'Troca de Assento Sanitário', 'Substituição de assento de vaso sanitário', 'un', 'por unidade', 50.00, 100.00, true, true, 'simple', ARRAY['assento', 'vaso', 'sanitário', 'troca'], ARRAY['low']);

-- ================================================
-- INSERT REPAIR SERVICES - FECHADURAS
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'troca_fechadura_simples', 'Troca de Fechadura Simples', 'Substituição de fechadura de porta interna', 'un', 'por unidade', 80.00, 150.00, true, true, 'simple', ARRAY['fechadura', 'troca', 'porta'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'troca_fechadura_externa', 'Troca de Fechadura Externa', 'Substituição de fechadura de porta de entrada', 'un', 'por unidade', 150.00, 300.00, true, true, 'medium', ARRAY['fechadura', 'troca', 'porta', 'entrada', 'externa'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'reparo_fechadura', 'Reparo de Fechadura', 'Conserto de fechadura com defeito', 'un', 'por serviço', 80.00, 160.00, true, true, 'simple', ARRAY['fechadura', 'reparo', 'conserto'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'copia_chave', 'Cópia de Chave', 'Confecção de cópia de chave', 'un', 'por unidade', 15.00, 50.00, true, true, 'simple', ARRAY['chave', 'cópia'], ARRAY['low']),
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'abertura_porta', 'Abertura de Porta', 'Abertura de porta trancada (chaveiro)', 'un', 'por serviço', 100.00, 250.00, false, true, 'medium', ARRAY['abertura', 'porta', 'trancada', 'chaveiro'], ARRAY['urgent']),
((SELECT id FROM service_categories WHERE code = 'fechadura'), 'instalacao_fechadura_digital', 'Instalação de Fechadura Digital', 'Instalação de fechadura eletrônica', 'un', 'por unidade', 200.00, 400.00, false, true, 'specialist', ARRAY['fechadura', 'digital', 'eletrônica', 'instalação'], ARRAY['medium']);

-- ================================================
-- INSERT REPAIR SERVICES - ALVENARIA
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'reparo_trinca_parede', 'Reparo de Trinca em Parede', 'Tratamento e fechamento de trinca', 'm', 'por metro', 50.00, 100.00, true, true, 'medium', ARRAY['trinca', 'parede', 'reparo', 'fissura'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'fechamento_vao', 'Fechamento de Vão', 'Fechamento de vão com alvenaria', 'm²', 'por m²', 120.00, 200.00, true, true, 'complex', ARRAY['vão', 'fechamento', 'alvenaria', 'parede'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'abertura_vao', 'Abertura de Vão', 'Abertura de vão em parede (não estrutural)', 'm²', 'por m²', 150.00, 280.00, true, true, 'complex', ARRAY['vão', 'abertura', 'parede'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'reboco_parede', 'Reboco de Parede', 'Aplicação de reboco em parede', 'm²', 'por m²', 45.00, 75.00, true, true, 'medium', ARRAY['reboco', 'parede', 'massa'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'chapisco', 'Aplicação de Chapisco', 'Aplicação de chapisco em superfície', 'm²', 'por m²', 25.00, 45.00, true, true, 'simple', ARRAY['chapisco', 'parede', 'preparação'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'alvenaria'), 'reparo_buraco_parede', 'Reparo de Buraco em Parede', 'Fechamento de buraco em parede', 'un', 'por unidade', 60.00, 120.00, true, true, 'simple', ARRAY['buraco', 'parede', 'reparo'], ARRAY['low', 'medium']);

-- ================================================
-- INSERT REPAIR SERVICES - TELHADO
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'telhado'), 'troca_telha', 'Troca de Telhas', 'Substituição de telhas quebradas', 'm²', 'por m²', 60.00, 110.00, true, true, 'medium', ARRAY['telha', 'troca', 'telhado', 'quebrada'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'telhado'), 'reparo_goteira', 'Reparo de Goteira', 'Identificação e reparo de goteira', 'un', 'por serviço', 200.00, 450.00, true, true, 'complex', ARRAY['goteira', 'reparo', 'telhado', 'vazamento'], ARRAY['high', 'urgent']),
((SELECT id FROM service_categories WHERE code = 'telhado'), 'limpeza_calha', 'Limpeza de Calha', 'Limpeza e desobstrução de calhas', 'm', 'por metro', 20.00, 40.00, true, true, 'simple', ARRAY['calha', 'limpeza', 'desobstrução'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'telhado'), 'reparo_calha', 'Reparo de Calha', 'Conserto ou troca de trecho de calha', 'm', 'por metro', 50.00, 100.00, true, true, 'medium', ARRAY['calha', 'reparo', 'troca'], ARRAY['medium', 'high']),
((SELECT id FROM service_categories WHERE code = 'telhado'), 'instalacao_rufo', 'Instalação de Rufo', 'Instalação de rufo metálico', 'm', 'por metro', 60.00, 110.00, true, true, 'medium', ARRAY['rufo', 'instalação', 'telhado'], ARRAY['medium']);

-- ================================================
-- INSERT REPAIR SERVICES - ESQUADRIAS
-- ================================================

INSERT INTO repair_services (category_id, code, name, description, unit, unit_label, base_price_min, base_price_max, includes_material, includes_labor, difficulty, keywords, severity_tags) VALUES
((SELECT id FROM service_categories WHERE code = 'esquadrias'), 'ajuste_janela_aluminio', 'Ajuste de Janela de Alumínio', 'Regulagem de janela de alumínio', 'un', 'por unidade', 100.00, 200.00, true, true, 'medium', ARRAY['janela', 'alumínio', 'ajuste', 'regulagem'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'esquadrias'), 'troca_roldana_janela', 'Troca de Roldana de Janela', 'Substituição de roldanas de janela de correr', 'un', 'por unidade', 80.00, 160.00, true, true, 'medium', ARRAY['roldana', 'janela', 'troca', 'correr'], ARRAY['medium']),
((SELECT id FROM service_categories WHERE code = 'esquadrias'), 'troca_fecho_janela', 'Troca de Fecho de Janela', 'Substituição de fecho ou trinco', 'un', 'por unidade', 60.00, 120.00, true, true, 'simple', ARRAY['fecho', 'janela', 'trinco', 'troca'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'esquadrias'), 'vedacao_janela', 'Vedação de Janela', 'Aplicação de vedação em janelas', 'm', 'por metro', 25.00, 50.00, true, true, 'simple', ARRAY['vedação', 'janela', 'borracha'], ARRAY['low', 'medium']),
((SELECT id FROM service_categories WHERE code = 'esquadrias'), 'troca_janela_aluminio', 'Troca de Janela de Alumínio', 'Substituição completa de janela', 'm²', 'por m²', 450.00, 800.00, true, true, 'complex', ARRAY['janela', 'alumínio', 'troca'], ARRAY['high']);

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE regions IS 'Brazilian regions with cost multipliers';
COMMENT ON TABLE service_categories IS 'Categories of repair services';
COMMENT ON TABLE repair_services IS 'Individual repair services with base prices';
COMMENT ON TABLE regional_cost_adjustments IS 'Regional price adjustments (multipliers or overrides)';
COMMENT ON TABLE cost_estimations IS 'History of cost estimations for analytics and feedback';
