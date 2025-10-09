#!/usr/bin/env python3
"""
Automated Economy Data Generator
Generates dynamic economy data based on player behavior, market trends, and seasonal events
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List

import requests


class EconomyDataGenerator:
    def __init__(self):
        self.base_items = self._load_base_items()
        self.market_trends = self._fetch_market_trends()
        self.seasonal_events = self._get_seasonal_events()

    def _load_base_items(self) -> List[Dict[str, Any]]:
        """Load base economy items template"""
        return [
            {
                "id": "coins_small",
                "type": "currency",
                "name": "Small Coin Pack",
                "cost_gems": 20,
                "cost_coins": 0,
                "quantity": 1000,
                "description": "Perfect for new players! Great value!",
                "rarity": "common",
                "category": "currency",
                "is_purchasable": True,
                "is_consumable": False,
                "is_tradeable": True,
                "icon_path": "UI/Currency/Coins",
            },
            {
                "id": "coins_medium",
                "type": "currency",
                "name": "Medium Coin Pack",
                "cost_gems": 120,
                "cost_coins": 0,
                "quantity": 5000,
                "description": "Most popular choice! Amazing value!",
                "rarity": "uncommon",
                "category": "currency",
                "is_purchasable": True,
                "is_consumable": False,
                "is_tradeable": True,
                "icon_path": "UI/Currency/Coins",
            },
            {
                "id": "coins_large",
                "type": "currency",
                "name": "Large Coin Pack",
                "cost_gems": 300,
                "cost_coins": 0,
                "quantity": 15000,
                "description": "For serious players! Maximum value!",
                "rarity": "rare",
                "category": "currency",
                "is_purchasable": True,
                "is_consumable": False,
                "is_tradeable": True,
                "icon_path": "UI/Currency/Coins",
            },
            {
                "id": "energy_small",
                "type": "currency",
                "name": "Energy Boost",
                "cost_gems": 5,
                "cost_coins": 0,
                "quantity": 5,
                "description": "Quick energy refill",
                "rarity": "common",
                "category": "consumable",
                "is_purchasable": True,
                "is_consumable": True,
                "is_tradeable": False,
                "icon_path": "UI/Currency/Energy",
            },
            {
                "id": "booster_extra_moves",
                "type": "booster",
                "name": "Extra Moves",
                "cost_gems": 0,
                "cost_coins": 200,
                "quantity": 3,
                "description": "Get 3 extra moves for your next level",
                "rarity": "common",
                "category": "booster",
                "is_purchasable": True,
                "is_consumable": True,
                "is_tradeable": True,
                "icon_path": "UI/Boosters/ExtraMoves",
            },
        ]

    def _fetch_market_trends(self) -> Dict[str, Any]:
        """Fetch current market trends (simulated)"""
        # In a real implementation, this would fetch from analytics APIs
        return {
            "inflation_rate": random.uniform(0.95, 1.05),
            "demand_multiplier": random.uniform(0.8, 1.2),
            "seasonal_adjustment": random.uniform(0.9, 1.1),
            "player_engagement": random.uniform(0.7, 1.0),
        }

    def _get_seasonal_events(self) -> List[Dict[str, Any]]:
        """Get current seasonal events"""
        current_month = datetime.now().month
        events = []

        # Holiday events
        if current_month == 12:  # December
            events.append(
                {
                    "name": "Christmas Special",
                    "multiplier": 1.2,
                    "items": ["holiday_coins", "christmas_booster"],
                }
            )
        elif current_month == 2:  # February
            events.append(
                {
                    "name": "Valentine's Day",
                    "multiplier": 1.15,
                    "items": ["valentine_pack", "love_booster"],
                }
            )
        elif current_month == 10:  # October
            events.append(
                {
                    "name": "Halloween",
                    "multiplier": 1.25,
                    "items": ["spooky_pack", "ghost_booster"],
                }
            )

        return events

    def generate_dynamic_pricing(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Apply dynamic pricing based on market trends"""
        new_item = item.copy()

        # Apply market trends
        if item["type"] == "currency":
            # Adjust gem costs based on market conditions
            price_multiplier = (
                self.market_trends["inflation_rate"]
                * self.market_trends["demand_multiplier"]
                * self.market_trends["seasonal_adjustment"]
            )

            new_item["cost_gems"] = max(1, int(item["cost_gems"] * price_multiplier))

            # Adjust quantity to maintain value perception
            quantity_multiplier = 1.0 / price_multiplier
            new_item["quantity"] = max(1, int(item["quantity"] * quantity_multiplier))

        return new_item

    def generate_seasonal_items(self) -> List[Dict[str, Any]]:
        """Generate seasonal items based on current events"""
        seasonal_items = []

        for event in self.seasonal_events:
            # Generate event-specific items
            for item_id in event["items"]:
                if "holiday" in item_id:
                    seasonal_items.append(
                        {
                            "id": item_id,
                            "type": "pack",
                            "name": f"{event['name']} Pack",
                            "cost_gems": int(100 * event["multiplier"]),
                            "cost_coins": 0,
                            "quantity": 1,
                            "description": f"Limited time {event['name']} offer!",
                            "rarity": "epic",
                            "category": "special",
                            "is_purchasable": True,
                            "is_consumable": False,
                            "is_tradeable": False,
                            "icon_path": f"UI/Packs/{item_id}",
                            "is_limited_time": True,
                            "available_until": (
                                datetime.now() + timedelta(days=7)
                            ).isoformat(),
                        }
                    )

        return seasonal_items

    def generate_limited_time_offers(self) -> List[Dict[str, Any]]:
        """Generate limited time offers based on player behavior"""
        offers = []

        # Flash sale (random chance)
        if random.random() < 0.3:  # 30% chance
            offers.append(
                {
                    "id": "flash_sale_limited",
                    "type": "pack",
                    "name": "Flash Sale!",
                    "cost_gems": 25,
                    "cost_coins": 0,
                    "quantity": 1,
                    "description": "Limited time! 75% off everything!",
                    "rarity": "legendary",
                    "category": "special",
                    "is_purchasable": True,
                    "is_consumable": False,
                    "is_tradeable": False,
                    "icon_path": "UI/Packs/FlashSale",
                    "is_limited_time": True,
                    "available_until": (
                        datetime.now() + timedelta(hours=6)
                    ).isoformat(),
                    "original_price": 100,
                    "discount_percentage": 75,
                }
            )

        # Comeback offer (for returning players)
        offers.append(
            {
                "id": "comeback_pack",
                "type": "pack",
                "name": "Welcome Back!",
                "cost_gems": 50,
                "cost_coins": 0,
                "quantity": 1,
                "description": "We missed you! Special comeback offer!",
                "rarity": "epic",
                "category": "special",
                "is_purchasable": True,
                "is_consumable": False,
                "is_tradeable": False,
                "icon_path": "UI/Packs/ComebackPack",
                "is_limited_time": True,
                "available_until": (datetime.now() + timedelta(days=3)).isoformat(),
                "original_price": 100,
                "discount_percentage": 50,
            }
        )

        return offers

    def generate_ab_test_variants(self, item: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate A/B test variants for items"""
        variants = []

        # Price variants
        price_variants = [
            {"multiplier": 0.8, "suffix": "_discount"},
            {"multiplier": 1.0, "suffix": "_control"},
            {"multiplier": 1.2, "suffix": "_premium"},
        ]

        for variant in price_variants:
            variant_item = item.copy()
            variant_item["id"] = item["id"] + variant["suffix"]
            variant_item["name"] = (
                item["name"] + f" ({variant['suffix'].replace('_', ' ').title()})"
            )
            variant_item["cost_gems"] = int(item["cost_gems"] * variant["multiplier"])
            variants.append(variant_item)

        return variants

    def generate_economy_data(self) -> List[Dict[str, Any]]:
        """Generate complete economy data"""
        all_items = []

        # Generate base items with dynamic pricing
        for item in self.base_items:
            dynamic_item = self.generate_dynamic_pricing(item)
            all_items.append(dynamic_item)

        # Generate seasonal items
        seasonal_items = self.generate_seasonal_items()
        all_items.extend(seasonal_items)

        # Generate limited time offers
        limited_offers = self.generate_limited_time_offers()
        all_items.extend(limited_offers)

        # Generate A/B test variants for top items
        top_items = [
            item for item in self.base_items if item["category"] == "currency"
        ][:2]
        for item in top_items:
            variants = self.generate_ab_test_variants(item)
            all_items.extend(variants)

        return all_items

    def save_to_csv(self, items: List[Dict[str, Any]], filepath: str):
        """Save items to CSV file"""
        if not items:
            return

        fieldnames = items[0].keys()

        with open(filepath, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(items)

        print(f"Saved {len(items)} items to {filepath}")

    def save_to_json(self, items: List[Dict[str, Any]], filepath: str):
        """Save items to JSON file for runtime loading"""
        data = {
            "items": items,
            "generated_at": datetime.now().isoformat(),
            "version": "1.0.0",
            "market_trends": self.market_trends,
            "seasonal_events": self.seasonal_events,
        }

        with open(filepath, "w", encoding="utf-8") as jsonfile:
            json.dump(data, jsonfile, indent=2, ensure_ascii=False)

        print(f"Saved economy data to {filepath}")

    def validate_data(self, items: List[Dict[str, Any]]) -> List[str]:
        """Validate generated economy data"""
        errors = []

        # Check for duplicate IDs
        ids = [item["id"] for item in items]
        duplicates = [id for id in set(ids) if ids.count(id) > 1]
        if duplicates:
            errors.append(f"Duplicate IDs found: {duplicates}")

        # Check for required fields
        required_fields = ["id", "type", "name", "cost_gems", "cost_coins", "quantity"]
        for i, item in enumerate(items):
            for field in required_fields:
                if field not in item or not item[field]:
                    errors.append(f"Item {i + 1}: Missing required field '{field}'")

        # Check for valid numeric values
        for i, item in enumerate(items):
            try:
                int(item.get("cost_gems", 0))
                int(item.get("cost_coins", 0))
                int(item.get("quantity", 0))
            except (ValueError, TypeError):
                errors.append(f"Item {i + 1}: Invalid numeric values")

        # Check business logic
        for i, item in enumerate(items):
            if item.get("is_purchasable", False):
                if item.get("cost_gems", 0) == 0 and item.get("cost_coins", 0) == 0:
                    errors.append(f"Item {i + 1}: Purchasable item with no cost")

        return errors


def main():
    """Main function to generate economy data"""
    generator = EconomyDataGenerator()

    # Generate economy data
    items = generator.generate_economy_data()

    # Validate data
    errors = generator.validate_data(items)
    if errors:
        print("Validation errors:")
        for error in errors:
            print(f"  - {error}")
        return False

    # Save to files
    os.makedirs("unity/Assets/StreamingAssets", exist_ok=True)
    generator.save_to_csv(items, "unity/Assets/StreamingAssets/economy_items.csv")
    generator.save_to_json(items, "unity/Assets/StreamingAssets/economy_data.json")

    print(f"Successfully generated {len(items)} economy items!")
    return True


if __name__ == "__main__":
    main()
