# ============================================================
# HEALTHFORECAST AI
# ANALYTICS ROUTES
# ============================================================

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from sqlalchemy import func

from app.database.postgres import get_db

from app.models.prediction import Prediction

from app.security.rbac import require_roles


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(

    prefix="/analytics",

    tags=[

        "Analytics"

    ]

)


# ============================================================
# ANALYTICS TEST
# ============================================================

@router.get(

    "/test"

)

def analytics_test():

    return {

        "success": True,

        "message":
        "Analytics router is working"

    }


# ============================================================
# PREDICTION SUMMARY
# ============================================================

@router.get(

    "/summary"

)

def prediction_summary(

    db: Session = Depends(

        get_db

    ),

    current_user=Depends(

        require_roles(

            [

                "doctor",

                "hospital_admin",

                "researcher",

                "system_admin"

            ]

        )

    )

):

    try:

        # ----------------------------------------------------
        # TOTAL PREDICTIONS
        # ----------------------------------------------------

        total_predictions = (

            db.query(

                Prediction

            )

            .count()

        )


        # ----------------------------------------------------
        # HIGH RISK COUNT
        # ----------------------------------------------------

        high_risk = (

            db.query(

                Prediction

            )

            .filter(

                Prediction.risk_level
                == "High Risk"

            )

            .count()

        )


        # ----------------------------------------------------
        # MEDIUM RISK COUNT
        # ----------------------------------------------------

        medium_risk = (

            db.query(

                Prediction

            )

            .filter(

                Prediction.risk_level
                == "Medium Risk"

            )

            .count()

        )


        # ----------------------------------------------------
        # LOW RISK COUNT
        # ----------------------------------------------------

        low_risk = (

            db.query(

                Prediction

            )

            .filter(

                Prediction.risk_level
                == "Low Risk"

            )

            .count()

        )


        return {

            "success": True,

            "total_predictions":
            total_predictions,

            "high_risk":
            high_risk,

            "medium_risk":
            medium_risk,

            "low_risk":
            low_risk

        }


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(

                "Unable to calculate "

                "analytics: "

                + str(e)

            )

        )


# ============================================================
# RISK DISTRIBUTION
# ============================================================

@router.get(

    "/risk-distribution"

)

def risk_distribution(

    db: Session = Depends(

        get_db

    ),

    current_user=Depends(

        require_roles(

            [

                "doctor",

                "hospital_admin",

                "researcher",

                "system_admin"

            ]

        )

    )

):

    try:

        results = (

            db.query(

                Prediction.risk_level,

                func.count(

                    Prediction.id

                )

            )

            .group_by(

                Prediction.risk_level

            )

            .all()

        )


        distribution = {}


        for risk_level, count in results:

            distribution[

                risk_level

            ] = count


        return {

            "success": True,

            "distribution":
            distribution

        }


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(

                "Unable to get "

                "risk distribution: "

                + str(e)

            )

        )


# ============================================================
# MODEL PERFORMANCE
# ============================================================

@router.get(

    "/model-performance"

)

def model_performance(

    current_user=Depends(

        require_roles(

            [

                "hospital_admin",

                "researcher",

                "system_admin"

            ]

        )

    )

):

    return {

        "success": True,

        "model_name":
        "CatBoost",

        "model_status":
        "active",

        "message":
        (
            "CatBoost is the active "
            "prediction model."
        )

    }