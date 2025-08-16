import { useState, useEffect } from "react";
import { searchFoods, getFood } from "../api/usda";

// map nutrients by USDA number codes
function makeNutrientMap(detail) {
  const map = {};
  for (const fn of detail?.foodNutrients || []) {
    const num = fn?.nutrient?.number; // "208" = Energy (kcal)
    if (num)
      map[num] = {
        name: fn.nutrient.name,
        unit: fn.nutrient.unitName,
        amount: fn.amount,
      };
  }
  return map;
}

function NutrientPanel({ detail, onClear }) {
  const n = makeNutrientMap(detail);
  const row = (label, num) => {
    const x = n[num];
    if (!x) return null;
    return (
      <tr>
        <td>{label}</td>
        <td className="text-end">
          {typeof x.amount === "number" ? x.amount : "-"}
        </td>
        <td>{x.unit}</td>
      </tr>
    );
  };

  return (
    <div className="d-flex flex-column gap-2">
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="m-0">{detail.description}</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={onClear}>
          Close
        </button>
      </div>
      {detail.brandOwner && (
        <div className="text-muted">{detail.brandOwner}</div>
      )}
      {detail.foodClass && (
        <div className="text-muted">Class: {detail.foodClass}</div>
      )}

      <table className="table table-sm align-middle mb-0">
        <tbody>
          {row("Calories", "208")}
          {row("Protein", "203")}
          {row("Total Fat", "204")}
          {row("Carbs", "205")}
          {row("Total Sugars", "269")}
          {row("Fiber", "291")}
          {row("Sodium", "307")}
          {row("Potassium", "306")}
          {row("Calcium", "301")}
          {row("Iron", "303")}
        </tbody>
      </table>
    </div>
  );
}

export default function FoodSearch() {
  const [q, setQ] = useState("apple");
  const [loading, setLoading] = useState(false);
  const [foods, setFoods] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "USDA API Caller";
  }, []);

  const run = async (pageNumber = 1) => {
    setError("");
    setDetail(null);
    setLoading(true);
    try {
      const data = await searchFoods(q, 10, pageNumber);
      setFoods(data.foods || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const open = async (fdcId) => {
    setError("");
    setDetail(null);
    setLoading(true);
    try {
      const d = await getFood(fdcId);
      setDetail(d);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* centered navbar title only */}
      <nav className="navbar navbar-dark bg-dark py-2">
        <div className="container-fluid d-flex justify-content-center">
          <span className="navbar-brand mb-0 h1">USDA API Caller</span>
        </div>
      </nav>

      <div className="container-fluid py-3">
        <div className="row g-3">
          {/* Left: search + results (full column width, not centered) */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100">
              <div
                className="card-body"
                style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}
              >
                <div className="input-group mb-3">
                  <input
                    className="form-control"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search foods..."
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => run(1)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Search"}
                  </button>
                </div>

                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                <ul className="list-group">
                  {foods.map((f) => (
                    <li
                      key={f.fdcId}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{f.description}</strong>{" "}
                        {f.brandOwner ? `• ${f.brandOwner}` : ""} [{f.dataType}]
                      </div>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => open(f.fdcId)}
                      >
                        Details
                      </button>
                    </li>
                  ))}
                </ul>

                {foods.length === 0 && !loading && (
                  <div className="text-muted mt-2">Search to see results</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: details */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm h-100">
              <div
                className="card-body"
                style={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}
              >
                {!detail ? (
                  <div className="text-muted">
                    Select an item on the left to see details
                  </div>
                ) : (
                  <NutrientPanel
                    detail={detail}
                    onClear={() => setDetail(null)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
