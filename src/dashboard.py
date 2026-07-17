"""
src/dashboard.py
Interactive Healthcare Analytics Dashboard - Week 3
"""

import pandas as pd
import numpy as np
import joblib
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
from dash.exceptions import PreventUpdate
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

class HealthcareDashboard:
    """Interactive dashboard for healthcare analytics"""
    
    def __init__(self):
        self.app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
        self.X = None
        self.y = None
        self.model = None
        self.feature_names = None
        self.risk_scores = None
        self.X_clean = None  # Cleaned version for predictions
        
        # Load data
        self.load_data()
        
        # Setup dashboard
        self.setup_layout()
        self.setup_callbacks()
    
    def load_data(self):
        """Load all necessary data"""
        print("📂 Loading data for dashboard...")
        
        # Load data
        self.X = joblib.load('data/processed/X_processed.pkl')
        self.y = joblib.load('data/processed/y_processed.pkl')
        self.model = joblib.load('models/risk_predictor.pkl')
        self.feature_names = joblib.load('models/feature_names.pkl')
        
        # Fix non-numeric columns
        self.X_clean = self.X.copy()
        self._fix_non_numeric()
        
        # Calculate risk scores on cleaned data
        self.risk_scores = self.model.predict_proba(self.X_clean)[:, 1]
        
        # Add readmitted to X
        self.X['readmitted'] = self.y
        self.X['risk_score'] = self.risk_scores
        self.X['risk_category'] = pd.cut(self.risk_scores, 
                                         bins=[0, 0.4, 0.7, 1], 
                                         labels=['Low', 'Medium', 'High'])
        
        print(f"✅ Dashboard data loaded! {len(self.X):,} patients")
        print(f"   - Readmission Rate: {self.y.mean():.2%}")
        print(f"   - High Risk Patients: {sum(self.risk_scores > 0.7):,}")
    
    def _fix_non_numeric(self):
        """Fix non-numeric columns in the data"""
        print("🔧 Fixing non-numeric columns...")
        
        # Find non-numeric columns
        non_numeric_cols = self.X_clean.select_dtypes(include=['object']).columns.tolist()
        
        if non_numeric_cols:
            print(f"   Found {len(non_numeric_cols)} non-numeric columns")
            
            for col in non_numeric_cols:
                try:
                    # Try to convert to numeric
                    self.X_clean[col] = pd.to_numeric(self.X_clean[col], errors='raise')
                except:
                    # If can't convert, use Label Encoding
                    le = LabelEncoder()
                    self.X_clean[col] = le.fit_transform(self.X_clean[col].astype(str))
        
        # Fill any NaN values
        self.X_clean = self.X_clean.fillna(0)
        
        print("   ✅ All columns are now numeric!")
        return self.X_clean
    
    def setup_layout(self):
        """Create dashboard layout"""
        self.app.layout = dbc.Container([
            # Header
            dbc.Row([
                dbc.Col([
                    html.H1("🏥 HealthForecast AI - Healthcare Analytics", 
                           className="text-center text-primary my-4")
                ], width=12)
            ]),
            
            # Key Metrics
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Total Patients", className="card-subtitle text-muted"),
                            html.H2(f"{len(self.X):,}", className="card-title"),
                            html.Small("Active patients in system", className="text-muted")
                        ])
                    ], className="text-center shadow-sm h-100")
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Readmission Rate", className="card-subtitle text-muted"),
                            html.H2(f"{self.y.mean():.1%}", className="card-title"),
                            html.Small("30-day readmission rate", className="text-muted")
                        ])
                    ], className="text-center shadow-sm h-100")
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("High Risk Patients", className="card-subtitle text-muted"),
                            html.H2(f"{sum(self.risk_scores > 0.7):,}", className="card-title"),
                            html.Small(f"{sum(self.risk_scores > 0.7)/len(self.X):.1%} of total", 
                                      className="text-muted")
                        ])
                    ], className="text-center shadow-sm h-100")
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Avg. Risk Score", className="card-subtitle text-muted"),
                            html.H2(f"{self.risk_scores.mean():.2%}", className="card-title"),
                            html.Small("Population risk average", className="text-muted")
                        ])
                    ], className="text-center shadow-sm h-100")
                ], width=3)
            ], className="mb-4"),
            
            # Charts Row 1
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("Risk Score Distribution", className="mb-0")),
                        dbc.CardBody([
                            dcc.Graph(id='risk-distribution', config={'displayModeBar': False})
                        ])
                    ], className="shadow-sm h-100")
                ], width=6),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader([
                            html.H5("Readmission by Feature", className="mb-0 d-inline-block"),
                            html.Span("   ", className="mx-2"),
                            dcc.Dropdown(
                                id='feature-dropdown',
                                options=[
                                    {'label': f.replace('_', ' ').title(), 'value': f}
                                    for f in ['age', 'time_in_hospital', 'medication_count', 
                                             'num_lab_procedures', 'num_medications']
                                    if f in self.X.columns
                                ],
                                value='age',
                                className='d-inline-block',
                                style={'width': '200px', 'display': 'inline-block'}
                            )
                        ], className="d-flex align-items-center"),
                        dbc.CardBody([
                            dcc.Graph(id='feature-analysis', config={'displayModeBar': False})
                        ])
                    ], className="shadow-sm h-100")
                ], width=6)
            ], className="mb-4"),
            
            # Charts Row 2
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("Treatment Effectiveness", className="mb-0")),
                        dbc.CardBody([
                            dcc.Graph(id='treatment-effectiveness', config={'displayModeBar': False})
                        ])
                    ], className="shadow-sm h-100")
                ], width=6),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("Feature Importance", className="mb-0")),
                        dbc.CardBody([
                            dcc.Graph(id='feature-importance', config={'displayModeBar': False})
                        ])
                    ], className="shadow-sm h-100")
                ], width=6)
            ], className="mb-4"),
            
            # Risk Distribution Table
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("Risk Category Distribution", className="mb-0")),
                        dbc.CardBody([
                            html.Div(id='risk-table')
                        ])
                    ], className="shadow-sm")
                ], width=12)
            ]),
            
            # Footer
            dbc.Row([
                dbc.Col([
                    html.Hr(),
                    html.P("HealthForecast AI - Hospital Readmission Prediction & Patient Risk Intelligence", 
                          className="text-center text-muted my-3")
                ], width=12)
            ])
            
        ], fluid=True, className="py-3")
    
    def setup_callbacks(self):
        """Setup interactive callbacks"""
        
        @self.app.callback(
            Output('risk-distribution', 'figure'),
            Input('risk-distribution', 'id')
        )
        def update_risk_distribution(_):
            """Create risk distribution histogram"""
            fig = px.histogram(
                self.X,
                x='risk_score',
                nbins=50,
                color='risk_category',
                color_discrete_map={'Low': 'green', 'Medium': 'yellow', 'High': 'red'},
                title="Patient Risk Score Distribution",
                labels={'risk_score': 'Risk Score', 'count': 'Number of Patients'},
                barmode='stack'
            )
            fig.add_vline(x=0.4, line_dash="dash", line_color="orange", 
                         annotation_text="Medium Risk Threshold")
            fig.add_vline(x=0.7, line_dash="dash", line_color="red", 
                         annotation_text="High Risk Threshold")
            fig.update_layout(
                showlegend=True,
                hovermode='x',
                bargap=0.1,
                height=350
            )
            return fig
        
        @self.app.callback(
            Output('feature-analysis', 'figure'),
            Input('feature-dropdown', 'value')
        )
        def update_feature_analysis(feature):
            """Update feature analysis chart"""
            if feature is None or feature not in self.X.columns:
                raise PreventUpdate
            
            # Categorical or continuous?
            if self.X[feature].nunique() < 10:
                agg_data = self.X.groupby(feature)['readmitted'].agg([
                    ('count', 'count'),
                    ('rate', 'mean')
                ]).reset_index()
                
                fig = px.bar(
                    agg_data,
                    x=feature,
                    y='rate',
                    text=agg_data['count'].apply(lambda x: f'n={x}'),
                    title=f"Readmission Rate by {feature.replace('_', ' ').title()}",
                    labels={'rate': 'Readmission Rate', feature: feature.replace('_', ' ').title()},
                    color='rate',
                    color_continuous_scale='RdBu_r'
                )
            else:
                # Continuous - create bins
                self.X['temp_bin'] = pd.qcut(self.X[feature], q=10, duplicates='drop')
                agg_data = self.X.groupby('temp_bin')['readmitted'].agg([
                    ('count', 'count'),
                    ('rate', 'mean')
                ]).reset_index()
                agg_data['bin_label'] = agg_data['temp_bin'].astype(str)
                
                fig = px.bar(
                    agg_data,
                    x='bin_label',
                    y='rate',
                    text=agg_data['count'].apply(lambda x: f'n={x}'),
                    title=f"Readmission Rate by {feature.replace('_', ' ').title()}",
                    labels={'rate': 'Readmission Rate', 'bin_label': feature.replace('_', ' ').title()},
                    color='rate',
                    color_continuous_scale='RdBu_r'
                )
            
            fig.update_layout(
                showlegend=False,
                hovermode='x unified',
                height=350
            )
            fig.update_traces(textposition='outside')
            
            return fig
        
        @self.app.callback(
            Output('treatment-effectiveness', 'figure'),
            Input('treatment-effectiveness', 'id')
        )
        def update_treatment_effectiveness(_):
            """Create treatment effectiveness visualization"""
            medications = ['metformin', 'insulin', 'glipizide', 'glyburide', 
                          'pioglitazone', 'rosiglitazone']
            treatment_data = []
            
            for med in medications:
                if med in self.X.columns:
                    # Handle different types of values in medication columns
                    if self.X[med].dtype == 'object':
                        on_med = self.X[self.X[med] != 'No']
                        off_med = self.X[self.X[med] == 'No']
                    else:
                        # For numeric columns, treat non-zero as "on"
                        on_med = self.X[self.X[med] != 0]
                        off_med = self.X[self.X[med] == 0]
                    
                    if len(on_med) > 0 and len(off_med) > 0:
                        treatment_data.append({
                            'Medication': med.upper(),
                            'With Medication': self.y.loc[on_med.index].mean(),
                            'Without Medication': self.y.loc[off_med.index].mean()
                        })
            
            df_treatment = pd.DataFrame(treatment_data)
            
            if not df_treatment.empty:
                fig = go.Figure()
                fig.add_trace(go.Bar(
                    x=df_treatment['Medication'],
                    y=df_treatment['With Medication'],
                    name='With Medication',
                    marker_color='green',
                    text=df_treatment['With Medication'].apply(lambda x: f'{x:.1%}'),
                    textposition='outside'
                ))
                fig.add_trace(go.Bar(
                    x=df_treatment['Medication'],
                    y=df_treatment['Without Medication'],
                    name='Without Medication',
                    marker_color='red',
                    text=df_treatment['Without Medication'].apply(lambda x: f'{x:.1%}'),
                    textposition='outside'
                ))
                fig.update_layout(
                    title="Treatment Effectiveness (Lower is Better)",
                    xaxis_title="Medication",
                    yaxis_title="Readmission Rate",
                    yaxis_tickformat='.0%',
                    barmode='group',
                    hovermode='x unified',
                    height=350,
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
                )
                return fig
            else:
                return go.Figure().update_layout(
                    title="No treatment data available",
                    height=350
                )
        
        @self.app.callback(
            Output('feature-importance', 'figure'),
            Input('feature-importance', 'id')
        )
        def update_feature_importance(_):
            """Create feature importance visualization"""
            if hasattr(self.model, 'feature_importances_'):
                importance_df = pd.DataFrame({
                    'feature': self.feature_names,
                    'importance': self.model.feature_importances_
                }).sort_values('importance', ascending=True).tail(20)
                
                fig = px.bar(
                    importance_df,
                    x='importance',
                    y='feature',
                    orientation='h',
                    title="Top 20 Feature Importance",
                    labels={'importance': 'Importance', 'feature': 'Feature'},
                    color='importance',
                    color_continuous_scale='Viridis',
                    height=350
                )
                fig.update_layout(
                    showlegend=False,
                    hovermode='y unified'
                )
                return fig
            else:
                return go.Figure().update_layout(
                    title="Feature importance not available for this model",
                    height=350
                )
        
        @self.app.callback(
            Output('risk-table', 'children'),
            Input('risk-table', 'id')
        )
        def update_risk_table(_):
            """Create risk category distribution table"""
            risk_counts = self.X['risk_category'].value_counts()
            risk_rates = self.X.groupby('risk_category')['readmitted'].mean()
            
            table = dbc.Table([
                html.Thead([
                    html.Tr([
                        html.Th("Risk Category"),
                        html.Th("Patients"),
                        html.Th("Percentage"),
                        html.Th("Readmission Rate")
                    ])
                ]),
                html.Tbody([
                    html.Tr([
                        html.Td("🔴 High"),
                        html.Td(f"{risk_counts.get('High', 0):,}"),
                        html.Td(f"{risk_counts.get('High', 0)/len(self.X)*100:.1f}%"),
                        html.Td(f"{risk_rates.get('High', 0):.1%}")
                    ], style={'backgroundColor': '#ffebee'} if risk_rates.get('High', 0) > 0.3 else {}),
                    html.Tr([
                        html.Td("🟡 Medium"),
                        html.Td(f"{risk_counts.get('Medium', 0):,}"),
                        html.Td(f"{risk_counts.get('Medium', 0)/len(self.X)*100:.1f}%"),
                        html.Td(f"{risk_rates.get('Medium', 0):.1%}")
                    ], style={'backgroundColor': '#fff3e0'} if risk_rates.get('Medium', 0) > 0.2 else {}),
                    html.Tr([
                        html.Td("🟢 Low"),
                        html.Td(f"{risk_counts.get('Low', 0):,}"),
                        html.Td(f"{risk_counts.get('Low', 0)/len(self.X)*100:.1f}%"),
                        html.Td(f"{risk_rates.get('Low', 0):.1%}")
                    ])
                ])
            ], bordered=True, hover=True, striped=True, size='sm')
            
            return table
    
    def run(self):
        """Run the dashboard"""
        print("\n" + "="*60)
        print("🚀 STARTING HEALTHCARE DASHBOARD")
        print("="*60)
        print("📊 Dashboard available at: http://localhost:8050")
        print("="*60)
        # FIX: Use app.run() instead of app.run_server()
        self.app.run(debug=True, port=8050)

if __name__ == "__main__":
    dashboard = HealthcareDashboard()
    dashboard.run()